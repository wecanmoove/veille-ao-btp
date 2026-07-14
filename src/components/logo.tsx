/**
 * Logo Renov Midi — maison en rénovation (toit + rouleau de peinture),
 * teal (rénovation durable) + orange (chantier).
 */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Corps de la maison */}
      <rect x="10" y="22" width="28" height="20" rx="2" fill="#0f766e" />
      {/* Porte */}
      <rect x="21" y="30" width="7" height="12" rx="1" fill="#f8fafc" />
      {/* Fenêtre */}
      <rect x="31" y="27" width="5" height="5" rx="1" fill="#99f6e4" />
      {/* Toit */}
      <path d="M6 24 L24 8 L42 24" stroke="#134e4a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Rouleau de peinture sur le toit (rénovation en cours) */}
      <rect x="26" y="10" width="12" height="6" rx="3" transform="rotate(40 26 10)" fill="#f97316" />
      <path d="M36 17 L40 22 L40 27" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Trace de peinture fraîche */}
      <path d="M13 20 L20 13" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo size={compact ? 28 : 34} />
      <span className="leading-tight">
        <span className="block font-extrabold tracking-tight text-slate-900 dark:text-white text-lg">
          Renov <span className="text-teal-700 dark:text-teal-400">Midi</span>
        </span>
        {!compact && (
          <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Veille AO BTP
          </span>
        )}
      </span>
    </span>
  );
}
