// Single-choice filter pills used by list screens. Keyboard users get the same
// control as touch users; the selected pill is announced with aria-pressed.
export default function FilterChips({ label, options, value, onChange, className = '' }) {
  return (
    <div role="group" aria-label={label} className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={[
              'h-11 rounded-full border px-3.5 text-[0.8rem] font-medium sm:h-9',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
              active
                ? 'border-brand/25 bg-brand-soft text-brand'
                : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-wash'
            ].join(' ')}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
