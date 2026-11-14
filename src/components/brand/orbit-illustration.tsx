/** Quiet orbital line drawing for the login panel. Decorative only. */
export function OrbitIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 520" className={className} aria-hidden>
      <defs>
        <radialGradient id="planet" cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor="var(--color-mint)" />
          <stop offset="100%" stopColor="var(--color-secondary)" />
        </radialGradient>
      </defs>
      <g className="origin-center animate-orbit" style={{ transformBox: "fill-box" }}>
        <circle cx="260" cy="260" r="236" fill="none" stroke="var(--color-primary)" strokeOpacity="0.14" strokeDasharray="2 7" />
        <circle cx="260" cy="24" r="4" fill="var(--color-coral)" />
      </g>
      <circle cx="260" cy="260" r="180" fill="none" stroke="var(--color-primary)" strokeOpacity="0.16" />
      <g className="origin-center animate-orbit-reverse" style={{ transformBox: "fill-box" }}>
        <ellipse cx="260" cy="260" rx="200" ry="74" transform="rotate(-24 260 260)" fill="none" stroke="var(--color-primary)" strokeOpacity="0.32" />
        <circle cx="440" cy="186" r="6" fill="var(--color-primary)" />
      </g>
      <circle cx="260" cy="260" r="92" fill="url(#planet)" stroke="var(--color-primary)" strokeOpacity="0.2" />
      <path d="M190 240c30 10 60-14 92-4s40 32 66 26" fill="none" stroke="var(--color-primary)" strokeOpacity="0.22" strokeWidth="1.5" />
      <path d="M180 282c40-6 62 18 100 12s52-20 74-14" fill="none" stroke="var(--color-primary)" strokeOpacity="0.16" strokeWidth="1.5" />
      <ellipse cx="260" cy="260" rx="132" ry="40" transform="rotate(-24 260 260)" fill="none" stroke="var(--color-coral)" strokeOpacity="0.45" strokeDasharray="1 5" />
    </svg>
  );
}
