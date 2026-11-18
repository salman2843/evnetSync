import { forwardRef, useId } from 'react';

// Labelled text input with an optional trailing control (for example the
// password reveal button) and an inline error message.
const TextField = forwardRef(function TextField(
  { label, error, id, className = '', trailing, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-[0.8rem] font-medium tracking-[0.01em] text-ink-soft"
      >
        {label}
      </label>

      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[
            'h-11 w-full rounded-field border bg-surface px-3.5 text-[0.95rem] text-ink',
            'shadow-field placeholder:text-muted',
            'transition-[border-color,box-shadow] duration-150',
            'focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10',
            error
              ? 'border-danger/70 focus:border-danger focus:ring-danger/10'
              : 'border-line hover:border-line-strong',
            trailing ? 'pr-12' : ''
          ].join(' ')}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0.5 flex items-center">{trailing}</div>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="mt-1.5 text-[0.8rem] leading-snug text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default TextField;
