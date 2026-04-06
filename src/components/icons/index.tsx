// WIZL Icon System — clean SVG icons replacing all emojis

export function WizlLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" stroke="url(#wizl-grad)" strokeWidth="2.5" />
      <path d="M10 16.5C10 13 12.5 10 16 10C19.5 10 22 13 22 16.5" stroke="url(#wizl-grad)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="18" r="3" fill="url(#wizl-grad)" />
      <path d="M16 8V6" stroke="url(#wizl-grad)" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="wizl-grad" x1="4" y1="4" x2="28" y2="28">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconHome({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function IconLeaf({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 20A7 7 0 019.8 6.9C15.5 4.9 20 4 20 4s-.9 4.5-2.9 10.2A7 7 0 0111 20z" />
      <path d="M4 20l7-7" />
    </svg>
  );
}

export function IconScan({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8v1" />
      <path d="M12 15v1" />
      <path d="M8 12h1" />
      <path d="M15 12h1" />
    </svg>
  );
}

export function IconMap({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconUser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconCamera({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function IconStar({ className = "w-4 h-4", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function IconHeart({ className = "w-4 h-4", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export function IconChevronRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function IconFlame({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 23c-3.866 0-7-2.686-7-6 0-1.665.539-2.87 1.475-4.136C7.727 11.256 9 9.605 9 7c0 0 2 1 3 4 1.5-2 1-4 1-4s4 2.5 4 7c0 3.314-2.134 6-5 6z" />
    </svg>
  );
}

export function IconDna({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 15c6.667-6 13.333 0 20-6" />
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      <path d="M17 6l-2.5 2.5" />
      <path d="M14 8l-1 1" />
      <path d="M7 18l2.5-2.5" />
      <path d="M3.5 14.5l.5-.5" />
      <path d="M20 9l.5-.5" />
      <path d="M2 9c6.667 6 13.333 0 20 6" />
    </svg>
  );
}

// Strain type icons with colored backgrounds
export function StrainTypeIcon({ type, size = "sm" }: { type: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-5 h-5 text-[10px]", md: "w-7 h-7 text-xs", lg: "w-10 h-10 text-sm" };
  const icons: Record<string, string> = { sativa: "S", indica: "I", hybrid: "H" };

  return (
    <div className={`${sizes[size]} strain-${type} rounded-full flex items-center justify-center font-black text-white`}>
      {icons[type] || "?"}
    </div>
  );
}
