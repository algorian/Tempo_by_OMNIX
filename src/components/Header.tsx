import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  rightContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, rightContent }) => {
  const [now] = React.useState(() => new Date());

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  return (
    <header
      id="tempo-header"
      className="relative flex items-center justify-between pb-2 sm:pb-3 pt-1 shrink-0 w-full"
    >
      <div className="flex flex-col gap-1">
        <span
          id="header-brand"
          className="font-mono text-xs font-medium tracking-[0.25em] text-[#A1A1AA] uppercase select-none"
        >
          TEMPO
        </span>
        <div className="flex flex-col">
          <h1
            id="header-greeting"
            className="text-sm sm:text-base font-medium tracking-tight text-[#EDEDEF]"
          >
            {greeting}
          </h1>
          <p
            id="header-date"
            className="text-[9px] sm:text-[10px] font-mono font-medium tracking-[0.2em] text-[#71717A] uppercase select-none"
          >
            {formattedDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {rightContent}
        {/* Mobile menu button */}
        <button
          id="mobile-nav-toggle"
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#202024] bg-[#0B0B0D] tempo-card-surface text-[#8A8A90] hover:border-[#2E2E35] hover:text-[#F5F5F7] lg:hidden transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};
