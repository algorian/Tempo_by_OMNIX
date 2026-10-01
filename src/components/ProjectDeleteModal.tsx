import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ProjectDeleteModalProps {
  isOpen: boolean;
  projectName: string;
  taskCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ProjectDeleteModal: React.FC<ProjectDeleteModalProps> = ({
  isOpen,
  projectName,
  taskCount = 0,
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus the cancel button by default for safety
    setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="project-delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-delete-modal-title"
      aria-describedby="project-delete-modal-description"
    >
      <div
        id="project-delete-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-[#2A2020] bg-[#0E0B0B] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.85)] flex flex-col gap-5 text-[#F5F5F7]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-[#F87171]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A1212] border border-[#4A2020]/60 text-[#F87171]">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h2
              id="project-delete-modal-title"
              className="text-base font-medium tracking-tight text-[#F5F5F7]"
            >
              Delete Project
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-[#5F6066] hover:text-[#F5F5F7] transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div id="project-delete-modal-description" className="flex flex-col gap-2.5 text-xs text-[#8A8A90] leading-relaxed">
          <p>
            Are you sure you want to delete <span className="font-medium text-[#F5F5F7]">"{projectName}"</span>?
          </p>
          <div className="rounded-lg border border-[#202024] bg-[#08080A] p-3 text-[11px] text-[#8A8A90] flex flex-col gap-1.5 font-mono">
            <div className="flex items-center justify-between text-[#F5F5F7]">
              <span>Associated Tasks:</span>
              <span>{taskCount > 0 ? `${taskCount} preserved` : '0 tasks'}</span>
            </div>
            <p className="text-[10px] text-[#5F6066] leading-normal font-sans">
              Tasks belonging to this project will be kept safely as independent tasks. Historical focus session logs remain intact.
            </p>
          </div>
          <p className="text-[11px] text-[#A1A1A6]">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#202024]/60">
          <button
            ref={cancelBtnRef}
            id="cancel-delete-project-btn"
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#26262E] bg-[#141418] px-3.5 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#1A1A20] hover:border-[#32323D] transition-all"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-project-btn"
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-[#6B2828] bg-[#221010] px-3.5 py-1.5 text-xs font-medium text-[#F87171] hover:bg-[#2C1414] hover:border-[#803030] hover:text-[#FCA5A5] transition-all"
          >
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
};
