// The one confirmation notice in the app. Fixed above the mobile tab bar so it
// never covers the primary action.
export default function Toast({ text, tone = 'muted' }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-sm justify-center lg:bottom-6"
    >
      {text ? (
        <span
          className={`rounded-card border bg-surface px-4 py-2.5 text-[0.83rem] leading-snug shadow-card ${
            tone === 'danger' ? 'border-danger/25 text-danger' : 'border-line text-ink-soft'
          }`}
        >
          {text}
        </span>
      ) : null}
    </p>
  );
}
