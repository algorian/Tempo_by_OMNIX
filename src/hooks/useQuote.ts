import { useState, useEffect, useCallback } from 'react';
import { Quote } from '../data/quotes';
import { getOrRotateCurrentQuote } from '../utils/quoteStorage';

export interface UseQuoteReturn {
  quote: Quote;
  author: string;
  expiresAt: number;
  displayedAt: number;
  refreshQuote: (force?: boolean) => void;
}

export function useQuote(): UseQuoteReturn {
  const [state, setState] = useState(() => getOrRotateCurrentQuote());

  // Function to check and update quote if 5 hours have elapsed
  const checkQuoteExpiry = useCallback((force: boolean = false) => {
    const now = Date.now();
    // Only rotate if expired or forced
    if (force || now >= state.expiresAt) {
      const next = getOrRotateCurrentQuote(now);
      setState(next);
    }
  }, [state.expiresAt]);

  useEffect(() => {
    // When TEMPO window becomes visible/focused, check if 5-hour expiry has passed
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkQuoteExpiry(false);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tempo_quote_state') {
        setState(getOrRotateCurrentQuote());
      }
    };

    const handleCustomUpdate = () => {
      setState(getOrRotateCurrentQuote());
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('tempo_quote_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('tempo_quote_updated', handleCustomUpdate);
    };
  }, [checkQuoteExpiry]);

  return {
    quote: state.quote,
    author: state.quote.author === 'TEMPO' ? '— TEMPO' : `— ${state.quote.author}`,
    expiresAt: state.expiresAt,
    displayedAt: state.displayedAt,
    refreshQuote: checkQuoteExpiry,
  };
}
