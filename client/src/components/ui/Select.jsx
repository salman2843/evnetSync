import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

// Labelled native select. Native is deliberate: it gives every phone the picker
// the planner already knows, and it stays keyboard accessible for free.
const Select = forwardRef(function Select(
  { label, error, hint, id, className = '', children, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-[0.8rem] font-medium tracking-[0.01em] text-ink-soft"
      >
        {label}
      </label>

      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={[
            'h-11 w-full appearance-none rounded-field border bg-surface pl-3.5 pr-10 text-[0.95rem] text-ink',
            'shadow-field transition-[border-color,box-shadow] duration-150',
            'focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10',
            error
              ? 'border-danger/70 focus:border-danger focus:ring-danger/10'
              : 'border-line hover:border-line-strong'
          ].join(' ')}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>

      {error ? (
        <p id={errorId} className="mt-1.5 text-[0.8rem] leading-snug text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[0.8rem] leading-snug text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
