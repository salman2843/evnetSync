// A field of toggle chips for "pick any that apply". Same look as FilterChips,
// but the value is a list, so the form can assign several service categories.
export default function MultiSelectChips({ label, options, value = [], onChange, hint, error }) {
  function toggle(id) {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  }

  return (
    <div>
      <p className="mb-2 block text-[0.8rem] font-medium tracking-[0.01em] text-ink-soft">
        {label}
      </p>

      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = value.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.id)}
              className={[
                'h-11 rounded-full border px-3.5 text-[0.8rem] font-medium sm:h-9',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                active
                  ? 'border-brand/25 bg-brand-soft text-brand'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-wash'
              ].join(' ')}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-1.5 text-[0.8rem] leading-snug text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.8rem] leading-snug text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
