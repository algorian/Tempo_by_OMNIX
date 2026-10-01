import React from 'react';
import { TimerStatus } from '../types';

interface AtmosphericBackgroundProps {
  status?: TimerStatus;
  isFocusMode?: boolean;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({
  status = 'idle',
  isFocusMode = false,
}) => {
  const isFocusing = status === 'focus';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';

  return (
    <div
      id="tempo-atmospheric-environment"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* Layer 1: Base Canvas Tone (Deep space black #050505) */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* Layer 2: Subtle Vertical Tonal Gradient (gives vertical room and horizon) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090A0E]/40 via-transparent to-[#030304]/80" />

      {/* Layer 3: Ambient Radial Glow behind Main Content / Orbit Clock */}
      <div
        id="atmospheric-primary-glow"
        className={`absolute left-1/2 -translate-x-1/2 rounded-full transition-all duration-1000 ease-out pointer-events-none ${
          isFocusMode
            ? 'top-1/2 -translate-y-1/2 w-[80vw] max-w-[680px] h-[80vw] max-h-[680px]'
            : 'top-10 sm:top-16 lg:top-20 w-[95vw] max-w-[960px] h-[650px]'
        } ${
          isFocusing
            ? 'opacity-100 scale-100'
            : isPaused
            ? 'opacity-35 scale-95'
            : isCompleted
            ? 'opacity-70 scale-100'
            : 'opacity-40 scale-95'
        }`}
        style={{
          background: isFocusMode
            ? isFocusing
              ? 'radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.05) 0%, rgba(120, 140, 180, 0.015) 45%, transparent 70%)'
              : isPaused
              ? 'radial-gradient(circle at 50% 50%, rgba(148, 163, 184, 0.02) 0%, transparent 60%)'
              : isCompleted
              ? 'radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.04) 0%, transparent 65%)'
              : 'radial-gradient(circle at 50% 50%, rgba(120, 140, 180, 0.025) 0%, transparent 60%)'
            : isFocusing
            ? 'radial-gradient(ellipse 65% 55% at 50% 40%, rgba(96, 165, 250, 0.075) 0%, rgba(120, 140, 180, 0.03) 38%, transparent 70%)'
            : isPaused
            ? 'radial-gradient(ellipse 65% 55% at 50% 40%, rgba(148, 163, 184, 0.035) 0%, rgba(100, 116, 139, 0.01) 32%, transparent 65%)'
            : isCompleted
            ? 'radial-gradient(ellipse 65% 55% at 50% 40%, rgba(52, 211, 153, 0.055) 0%, rgba(148, 163, 184, 0.02) 35%, transparent 68%)'
            : 'radial-gradient(ellipse 65% 55% at 50% 40%, rgba(120, 140, 180, 0.045) 0%, rgba(96, 165, 250, 0.015) 32%, transparent 65%)',
        }}
      />

      {/* Layer 4: Distant Secondary Radial Glow toward opposing bottom-right corner (Dashboard only) */}
      {!isFocusMode && (
        <div
          id="atmospheric-secondary-glow"
          className="absolute -bottom-24 -right-24 w-[55vw] max-w-[700px] h-[55vw] max-h-[700px] rounded-full pointer-events-none opacity-50"
          style={{
            background:
              'radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 0.018) 0%, rgba(56, 189, 248, 0.006) 35%, transparent 65%)',
          }}
        />
      )}

      {/* Layer 5: Subtle Tertiary Glow toward upper-left canvas margin (Dashboard only) */}
      {!isFocusMode && (
        <div
          id="atmospheric-tertiary-glow"
          className="absolute -top-20 -left-20 w-[45vw] max-w-[550px] h-[45vw] max-h-[550px] rounded-full pointer-events-none opacity-40"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(148, 163, 184, 0.015) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Layer 6: Soft Light Field behind Dashboard Core (Dashboard only) */}
      {!isFocusMode && (
        <div
          id="atmospheric-light-field"
          className={`absolute left-1/2 -translate-x-1/2 top-16 sm:top-24 w-[85vw] max-w-[820px] h-[400px] rounded-full filter blur-[100px] sm:blur-[130px] pointer-events-none transition-opacity duration-1000 ease-out ${
            isFocusing
              ? 'opacity-60 bg-gradient-to-b from-[#60A5FA]/[0.04] to-transparent'
              : isPaused
              ? 'opacity-20 bg-gradient-to-b from-[#94A3B8]/[0.015] to-transparent'
              : isCompleted
              ? 'opacity-50 bg-gradient-to-b from-[#34D399]/[0.03] to-transparent'
              : 'opacity-30 bg-gradient-to-b from-[#60A5FA]/[0.02] to-transparent'
          }`}
        />
      )}

      {/* Layer 7: Subtle Vignette (Darkens periphery and corners without heavy contrast) */}
      <div
        id="atmospheric-vignette"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 92% 84% at 50% 50%, transparent 62%, rgba(2, 2, 3, 0.45) 100%)',
        }}
      />

      {/* Layer 8: Microscopic Tactile Surface Texture (imperceptible physical matte grain) */}
      <div
        id="atmospheric-micro-texture"
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
};
