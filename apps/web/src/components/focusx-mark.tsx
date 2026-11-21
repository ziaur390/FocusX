export function FocusxMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path
        d="M16 4a12 12 0 0 1 12 12"
        fill="none"
        stroke="#16122D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 28A12 12 0 0 1 4 16"
        fill="none"
        stroke="#16122D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="6.5" fill="#6945F5" />
    </svg>
  );
}

export function FocusxLockup({ size = 26 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <FocusxMark size={size} />
      <span className="font-display text-lg font-semibold tracking-tight">
        FocusX
      </span>
    </span>
  );
}
