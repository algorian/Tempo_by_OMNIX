import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const distPath = path.resolve(__dirname, 'dist');
const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));
const isDev = process.env.NODE_ENV === 'development';

// In Cloud Run (K_SERVICE is set) or when dist is built and not explicitly dev:
const isProduction =
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.K_SERVICE) ||
  (!isDev && hasDist);

app.use(express.json());

// Health endpoints for Cloud Run startup/liveness probes
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export type AIErrorCode =
  | 'AI_CONFIG_MISSING'
  | 'AI_AUTH_ERROR'
  | 'AI_PERMISSION_ERROR'
  | 'AI_MODEL_UNAVAILABLE'
  | 'AI_RATE_LIMITED'
  | 'AI_NETWORK_ERROR'
  | 'AI_REQUEST_ERROR'
  | 'AI_RESPONSE_ERROR'
  | 'AI_UNKNOWN_ERROR';

/**
 * Classifies raw Gemini API and network errors into typed TEMPO error codes.
 * Ensures raw credentials or confusing API errors are never leaked to end users.
 */
function classifyGeminiError(err: unknown): {
  errorCode: AIErrorCode;
  userMessage: string;
  diagnosticDetails: string;
} {
  const message = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;

  let errorCode: AIErrorCode = 'AI_UNKNOWN_ERROR';
  let userMessage = 'AI Coach interpretation is temporarily unavailable.';

  if (
    status === 401 ||
    message.includes('API_KEY_INVALID') ||
    message.includes('UNAUTHENTICATED')
  ) {
    errorCode = 'AI_AUTH_ERROR';
    userMessage = 'AI interpretation requires valid credentials.';
  } else if (status === 403 || message.includes('PERMISSION_DENIED')) {
    errorCode = 'AI_PERMISSION_ERROR';
    userMessage = 'AI interpretation access is currently restricted.';
  } else if (
    status === 429 ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.toLowerCase().includes('quota') ||
    message.toLowerCase().includes('rate limit')
  ) {
    errorCode = 'AI_RATE_LIMITED';
    userMessage = 'AI Coach rate limit reached. Telemetry remains active.';
  } else if (
    status === 503 ||
    status === 404 ||
    message.includes('UNAVAILABLE') ||
    message.toLowerCase().includes('high demand') ||
    message.toLowerCase().includes('overloaded')
  ) {
    errorCode = 'AI_MODEL_UNAVAILABLE';
    userMessage = 'AI interpretation is temporarily unavailable due to demand.';
  } else if (status === 400 || message.includes('INVALID_ARGUMENT')) {
    errorCode = 'AI_REQUEST_ERROR';
    userMessage = 'AI interpretation request could not be processed.';
  } else if (
    message.includes('fetch failed') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('ENOTFOUND')
  ) {
    errorCode = 'AI_NETWORK_ERROR';
    userMessage = 'Network connection to AI interpretation service interrupted.';
  } else if (
    message.includes('Malformed') ||
    message.includes('Empty response') ||
    message.includes('Unexpected token') ||
    message.includes('JSON')
  ) {
    errorCode = 'AI_RESPONSE_ERROR';
    userMessage = 'AI interpretation output could not be structured.';
  }

  return {
    errorCode,
    userMessage,
    diagnosticDetails: message.slice(0, 300),
  };
}

/**
 * Health & Config probe for developer diagnostics.
 * Never leaks the actual secret key.
 */
app.get('/api/coach/status', (_req, res) => {
  const rawKey = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(
    rawKey &&
    rawKey.trim() !== '' &&
    rawKey !== 'MY_GEMINI_API_KEY'
  );

  res.json({
    configured: isConfigured,
    primaryModel: 'gemini-3.8-flash',
    fallbackModel: 'gemini-3.1-flash-lite',
  });
});

/**
 * Server-side Gemini AI Coach Insight generation endpoint.
 * Protects credentials, implements resilient model fallback, and guarantees strict grounding.
 */
app.post('/api/coach/insight', async (req, res) => {
  const { context } = req.body;

  if (!context || !context.week) {
    res.status(400).json({
      status: 'error',
      errorCode: 'AI_REQUEST_ERROR',
      userMessage: 'Invalid telemetry context provided.',
      diagnosticDetails: 'Missing context or context.week in request body.',
    });
    return;
  }

  // Insufficient telemetry check (deterministic boundary)
  if (context.week.sessionCount < 3) {
    res.json({
      status: 'no-data',
      insight: {
        title: 'Telemetry Initializing',
        message: 'Complete at least 3 focus sessions to observe statistically valid patterns.',
        action: 'Start a session',
      },
    });
    return;
  }

  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey || rawKey.trim() === '' || rawKey === 'MY_GEMINI_API_KEY') {
    res.json({
      status: 'unavailable',
      errorCode: 'AI_CONFIG_MISSING',
      userMessage: 'AI interpretation requires Gemini availability.',
      diagnosticDetails: 'GEMINI_API_KEY is not configured in runtime environment.',
    });
    return;
  }

  const systemInstruction = `You are TEMPO's Grounded AI Focus Coach.
You provide precise, minimal, objective observations based SOLELY on the provided FocusCoachContext JSON.
RULES:
1. Grounding: You MUST ONLY make claims mathematically justified by the provided data. Never invent stats, never guess habits not in data.
2. Caution: Use cautious phrasing for small sample sizes ("Your recent sessions suggest..." rather than "You are definitely...").
3. Brevity: Output strictly valid JSON matching this schema:
   {
     "title": string (max 60 characters, concise and punchy),
     "message": string (max 180 characters, restrained and grounded),
     "action": string | null (max 80 characters, subtle suggestion or null)
   }
4. Tone: Minimal, calm, intellectual, non-chatty, zero exclamation marks, zero generic life advice.`;

  const prompt = `Here is the user's deterministic focus telemetry context:
${JSON.stringify(context, null, 2)}

Provide one single grounded insight based strictly on this data.`;

  const ai = new GoogleGenAI({
    apiKey: rawKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Resilient multi-tier model execution:
  // Primary: 'gemini-3.8-flash'
  // Fallback: 'gemini-3.1-flash-lite' (high availability under heavy load)
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: unknown = null;
  let parsedInsight: { title: string; message: string; action: string | null } | null = null;
  let successfulModel: string | null = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error(`Empty response returned from ${modelName}`);
      }

      const parsed = JSON.parse(text);
      if (!parsed.title || !parsed.message) {
        throw new Error(`Malformed schema returned from ${modelName}`);
      }

      parsedInsight = {
        title: String(parsed.title).slice(0, 60).trim(),
        message: String(parsed.message).slice(0, 180).trim(),
        action: parsed.action ? String(parsed.action).slice(0, 80).trim() : null,
      };

      successfulModel = modelName;
      break;
    } catch (err) {
      lastError = err;
      const diag = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Coach] Model ${modelName} call failed:`, diag);
      // If error is authentication/permission or invalid argument, fallback won't help
      const status = (err as { status?: number })?.status;
      if (status === 401 || status === 403 || status === 400) {
        break;
      }
    }
  }

  if (parsedInsight && successfulModel) {
    res.json({
      status: 'available',
      insight: parsedInsight,
      modelUsed: successfulModel,
    });
    return;
  }

  // If all model tiers failed, classify the error
  const { errorCode, userMessage, diagnosticDetails } = classifyGeminiError(lastError);
  console.error('[AI Coach Diagnostic Failure]:', { errorCode, diagnosticDetails });

  res.json({
    status: 'unavailable',
    errorCode,
    userMessage,
    diagnosticDetails,
  });
});

// Mount Vite or serve static production build
async function startServer() {
  if (isProduction && hasDist) {
    console.log(`[TEMPO] Serving static production build from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.resolve(distPath, 'index.html'), (err) => {
        if (err) {
          console.error('[TEMPO] Error sending index.html:', err);
          res.status(500).send('Application load error');
        }
      });
    });
  } else {
    console.log('[TEMPO] Starting Vite in development middleware mode');
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`TEMPO Server active on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });

  server.on('error', (err: unknown) => {
    console.error('[TEMPO] Server listen error:', err);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('[TEMPO] SIGTERM received, closing HTTP server');
    server.close(() => {
      console.log('[TEMPO] HTTP server closed');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start TEMPO server:', err);
  process.exit(1);
});
