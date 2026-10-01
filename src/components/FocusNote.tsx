import React from 'react';
import { useQuote } from '../hooks/useQuote';

export interface FocusNoteProps {
  className?: string;
}

export const FocusNote: React.FC<FocusNoteProps> = ({ className = '' }) => {
  const { quote, author } = useQuote();

  return (
    <div
      id="tempo-focus-note"
      aria-label="Focus inspiration quote"
      className={`select-none transition-colors duration-300 ${className}`}
    >
      <blockquote
        id="focus-note-quote"
        className="text-[13px] sm:text-sm font-normal text-[#A1A1AA] hover:text-[#EDEDEF] leading-relaxed italic"
      >
        "{quote.text}"
      </blockquote>
      <span
        id="focus-note-author"
        className="block mt-1 font-mono text-[9px] sm:text-[10px] font-medium text-[#71717A] tracking-[0.2em] uppercase"
      >
        — {author}
      </span>
    </div>
  );
};
