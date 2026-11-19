import { forwardRef, useId } from 'react';

// Same contract as TextField, for the longer fields (address, notes).
const Textarea = forwardRef(function Textarea(
  { label, error, hint, id, className = '', rows = 3, ...props },
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

      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={[
          'w-full resize-y rounded-field border bg-surface px-3.5 py-3 text-[0.95rem] leading-relaxed text-ink',
          'shadow-field placeholder:text-muted',
          'transition-[border-color,box-shadow] duration-150',
          'focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10',
          error
            ? 'border-danger/70 focus:border-danger focus:ring-danger/10'
            : 'border-line hover:border-line-strong'
        ].join(' ')}
        {...props}
      />

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

export default Textarea;
