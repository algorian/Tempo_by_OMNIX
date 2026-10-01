import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface FinishEarlyModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onConfirmFinish: () => void;
  focusedMinutes: number;
}

export const FinishEarlyModal: React.FC<FinishEarlyModalProps> = ({
  isOpen,
  onContinue,
  onConfirmFinish,
  focusedMinutes,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  return (
    <div
      id="finish-early-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-early-title"
    >
      <div
        id="finish-early-modal-content"
        className="w-full max-w-sm rounded-xl border border-[#202024] bg-[#0E0E11] p-6 shadow-2xl transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-[#F5F5F7]">
            <AlertCircle className="h-4 w-4 text-[#8A8A90]" />
            <h3
              id="finish-early-title"
              className="text-sm font-medium tracking-tight text-[#F5F5F7]"
            >
              Finish this session early?
            </h3>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="text-[#5F6066] hover:text-[#F5F5F7] transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-[#8A8A90] leading-relaxed">
          Your focused progress of{' '}
          <span className="font-mono text-[#F5F5F7] font-medium">
            {focusedMinutes} min
          </span>{' '}
          will be saved to your session history as finished early.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            id="finish-early-btn-continue"
            type="button"
            onClick={onContinue}
            className="h-9 rounded-md border border-[#202024] bg-[#141417] px-4 text-xs font-medium text-[#8A8A90] hover:bg-[#1A1A1E] hover:text-[#F5F5F7] transition-colors"
          >
            Continue
          </button>
          <button
            id="finish-early-btn-confirm"
            type="button"
            onClick={onConfirmFinish}
            className="h-9 rounded-md border border-[#2E2E35] bg-[#1A1A1E] px-4 text-xs font-medium text-[#F5F5F7] hover:bg-[#222228] transition-colors"
          >
            Finish session
          </button>
        </div>
      </div>
    </div>
  );
};
