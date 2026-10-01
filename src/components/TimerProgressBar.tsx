import React, { useEffect, useRef, useState } from 'react';
import { TimerStatus } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface TimerProgressBarProps {
  status: TimerStatus;
  progress: number; // authoritative fallback ratio (0..1)
  getExactProgress?: () => number;
  className?: string;
  id?: string;
}

export const TimerProgressBar: React.FC<TimerProgressBarProps> = ({
  status,
  progress,
  getExactProgress,
  className = '',
  id = 'session-progress-bar',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const fillRef = useRef<HTMLDivElement>(null);

  const isFocusing = status === 'focus';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';

  // Compute initial percentage for ARIA
  const [ariaPercent, setAriaPercent] = useState<number>(() => {
    const raw = isFinite(progress) ? progress : 0;
    const ratio = raw <= 1 ? raw : raw / 100;
    return Math.round(Math.max(0, Math.min(100, ratio * 100)));
  });

  // Authoritative exact ratio resolver
  const resolveCurrentRatio = (): number => {
    if (isCompleted) return 1;
    if (getExactProgress) {
      const val = getExactProgress();
      if (!isNaN(val) && isFinite(val)) {
        return Math.max(0, Math.min(1, val));
      }
    }
    const raw = isFinite(progress) ? progress : 0;
    const ratio = raw <= 1 ? raw : raw / 100;
    return Math.max(0, Math.min(1, ratio));
  };

  // Continuous high-precision GPU transform updates based on real timer state
  useEffect(() => {
    let animId: number;
    let lastAriaUpdate = 0;

    const updateVisuals = (now: number) => {
      const ratio = resolveCurrentRatio();

      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${ratio})`;
      }

      // Throttled ARIA update to prevent accessibility thrashing
      if (now - lastAriaUpdate > 500) {
        setAriaPercent(Math.round(ratio * 100));
        lastAriaUpdate = now;
      }
    };

    if (isFocusing && !prefersReducedMotion) {
      const loop = (timestamp: number) => {
        updateVisuals(timestamp);
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    } else {
      // Immediate single sync for paused, completed, or reduced-motion modes
      updateVisuals(performance.now());
    }

    return () => {
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [isFocusing, isPaused, isCompleted, progress, getExactProgress, prefersReducedMotion]);

  const initialRatio = resolveCurrentRatio();

  return (
    <div
      id={id}
      className={`relative h-[2px] bg-white/[0.08] overflow-hidden rounded-full select-none shrink-0 ${className}`}
      role="progressbar"
      aria-valuenow={ariaPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      title={`Session progress: ${ariaPercent}%`}
    >
      {/* Precision monochrome progress fill driven by continuous scaleX */}
      <div
        ref={fillRef}
        className={`w-full h-full rounded-full origin-left will-change-transform ${
          isPaused
            ? 'bg-[#71717A]'
            : isCompleted
            ? 'bg-[#E4E4E7]'
            : 'bg-[#A1A1AA]'
        }`}
        style={{
          transform: `scaleX(${initialRatio})`,
          transformOrigin: 'left',
        }}
      />
    </div>
  );
};
