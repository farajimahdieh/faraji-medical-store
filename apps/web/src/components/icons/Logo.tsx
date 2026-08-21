// Faithful recreation of the store's real logo (per the reference crop):
// a red heart with a black ECG/pulse line through it, an "F" inside the
// lower part of the heart, a black stethoscope tube wrapping around in a
// U shape, and an "M" centered at the bottom inside that tube. Kept as
// clean vector shapes for crisp reuse at small UI sizes — same shapes,
// proportions, and colors as the reference, not a redesign.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-white p-1.5 ${className}`}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        {/* Stethoscope tube, U-shaped around the mark */}
        <path
          d="M14 4 C11 4 9 6 9 9 L9 30 C9 40 16 46 25 47 M50 4 C53 4 55 6 55 9 L55 30 C55 40 48 46 39 47"
          fill="none"
          stroke="#0A0A0A"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="32" cy="49" r="10" fill="none" stroke="#0A0A0A" strokeWidth="2.6" />

        {/* Heart */}
        <path
          d="M32 26 C32 19 26 14 19 14 C11 14 5 20 5 27 C5 38 16 46 32 58 C48 46 59 38 59 27 C59 20 53 14 45 14 C38 14 32 19 32 26 Z"
          fill="#D62839"
        />

        {/* ECG / pulse line through the heart */}
        <polyline
          points="10,28 19,28 23,18 27,36 31,22 35,28 58,28"
          fill="none"
          stroke="#0A0A0A"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* F inside the lower part of the heart */}
        <text x="32" y="43" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0A0A0A" fontFamily="Arial, sans-serif">
          F
        </text>
        {/* M centered at the bottom, inside the stethoscope loop */}
        <text x="32" y="55" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0A0A0A" fontFamily="Arial, sans-serif">
          M
        </text>
      </svg>
    </span>
  );
}
