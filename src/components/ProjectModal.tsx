import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Project } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => void;
  initialProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setError('');
  }, [isOpen, initialProject]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      id="project-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div
        id="project-modal-content"
        className="flex w-full max-w-md flex-col rounded-xl border border-[#202024] bg-[#0E0E11] p-5 sm:p-6 shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#202024]">
          <h3
            id="project-modal-title"
            className="text-sm font-medium tracking-tight text-[#F5F5F7]"
          >
            {initialProject ? 'Edit Project' : 'New Project'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5F6066] hover:text-[#F5F5F7] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 text-xs">
          {error && (
            <div className="rounded border border-red-900/50 bg-red-950/20 px-3 py-1.5 text-[11px] text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="project-name-input"
              className="text-[#8A8A90] font-mono text-[10px] uppercase tracking-wider"
            >
              Project Name *
            </label>
            <input
              id="project-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. System Architecture Redesign"
              className="h-9 rounded-lg border border-[#202024] bg-[#141417] px-3 text-xs text-[#F5F5F7] placeholder-[#5F6066] focus:border-[#2E2E35] focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="project-description-input"
              className="text-[#8A8A90] font-mono text-[10px] uppercase tracking-wider"
            >
              Description (Optional)
            </label>
            <textarea
              id="project-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Core deliverables, milestones, and focus targets"
              className="resize-none rounded-lg border border-[#202024] bg-[#141417] p-2.5 text-xs text-[#F5F5F7] placeholder-[#5F6066] focus:border-[#2E2E35] focus:outline-none transition-colors"
            />
          </div>

          <div className="mt-3 pt-3 border-t border-[#202024] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg border border-[#202024] bg-[#141417] px-3 text-xs text-[#8A8A90] hover:text-[#F5F5F7] transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-project-submit-btn"
              type="submit"
              className="h-8 rounded-lg border border-[#2E2E35] bg-[#F5F5F7] px-4 text-xs font-medium text-[#050505] hover:bg-white transition-colors inline-flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{initialProject ? 'Save Changes' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
