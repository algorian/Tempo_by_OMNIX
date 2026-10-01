import {
  Quote,
  StoredQuoteState,
  QUOTES_LIBRARY,
  QUOTE_STORAGE_KEY,
  QUOTE_LIFETIME_MS,
} from '../data/quotes';

/**
 * Validates that a stored state object contains valid timestamps and an existing quoteId.
 */
export function isValidQuoteState(state: any, now: number = Date.now()): state is StoredQuoteState {
  if (!state || typeof state !== 'object') return false;
  if (typeof state.quoteId !== 'string' || !state.quoteId.trim()) return false;

  // Check that the quote exists in the curated library
  const exists = QUOTES_LIBRARY.some((q) => q.id === state.quoteId);
  if (!exists) return false;

  const displayedAt = Number(state.displayedAt);
  const expiresAt = Number(state.expiresAt);

  if (isNaN(displayedAt) || isNaN(expiresAt) || displayedAt <= 0 || expiresAt <= 0) {
    return false;
  }

  // Ensure expiresAt is strictly after displayedAt
  if (expiresAt <= displayedAt) {
    return false;
  }

  // Clock sanity check: displayedAt cannot be in the distant future (> 5 minutes clock drift)
  if (displayedAt > now + 300000) {
    return false;
  }

  return true;
}

/**
 * Safely retrieve the stored quote state from localStorage.
 * Returns null if missing or corrupted.
 */
export function getStoredQuoteState(now: number = Date.now()): StoredQuoteState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(QUOTE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (isValidQuoteState(parsed, now)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely persist the quote state to localStorage.
 */
export function saveQuoteState(state: StoredQuoteState): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(state));
    if (typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tempo_quote_updated'));
    }
  } catch (err) {
    console.warn('Failed to save TEMPO quote state', err);
  }
}

/**
 * Select a quote from the library, ensuring NO immediate repetition of the previous quote.
 */
export function selectNextQuote(excludeId?: string | null): Quote {
  if (QUOTES_LIBRARY.length === 0) {
    // Graceful fallback if library is empty
    return {
      id: 'tempo-fallback',
      text: 'Attention is a resource. Spend it deliberately.',
      author: 'TEMPO',
      category: 'focus',
    };
  }

  // Filter out the immediately previous quote if possible
  const candidates =
    QUOTES_LIBRARY.length > 1 && excludeId
      ? QUOTES_LIBRARY.filter((q) => q.id !== excludeId)
      : QUOTES_LIBRARY;

  const selectedIndex = Math.floor(Math.random() * candidates.length);
  return candidates[selectedIndex] || QUOTES_LIBRARY[0];
}

/**
 * Authoritative quote resolution function:
 * - If state exists and current time < expiresAt -> return existing quote.
 * - If no state or current time >= expiresAt -> select a new quote (5-hour window).
 * - Persists across re-renders, refreshes, and navigation.
 */
export function getOrRotateCurrentQuote(now: number = Date.now()): {
  quote: Quote;
  displayedAt: number;
  expiresAt: number;
} {
  const currentState = getStoredQuoteState(now);

  // If valid state exists and current time is still within the 5-hour window:
  if (currentState && now < currentState.expiresAt) {
    const existingQuote = QUOTES_LIBRARY.find((q) => q.id === currentState.quoteId);
    if (existingQuote) {
      return {
        quote: existingQuote,
        displayedAt: currentState.displayedAt,
        expiresAt: currentState.expiresAt,
      };
    }
  }

  // Otherwise, 5-hour window has expired (or first launch, or corrupted state):
  const previousId = currentState?.quoteId || null;
  const nextQuote = selectNextQuote(previousId);

  const displayedAt = now;
  const expiresAt = now + QUOTE_LIFETIME_MS;

  const previousRecent = Array.isArray(currentState?.recentQuoteIds)
    ? currentState.recentQuoteIds
    : previousId
    ? [previousId]
    : [];

  const updatedRecent = [nextQuote.id, ...previousRecent.filter((id) => id !== nextQuote.id)].slice(
    0,
    10
  );

  const newState: StoredQuoteState = {
    quoteId: nextQuote.id,
    displayedAt,
    expiresAt,
    recentQuoteIds: updatedRecent,
  };

  saveQuoteState(newState);

  return {
    quote: nextQuote,
    displayedAt,
    expiresAt,
  };
}
