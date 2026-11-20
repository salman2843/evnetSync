import { forwardRef, useId } from 'react';

// Phone entry with the country code in its own box: the planner types only the
// ten national digits, and the form saves one E.164 string.
// onChange receives `{ target: { name, value } }` with the digits already
// cleaned, so a form's shared handleChange works without a special case.
const PhoneField = forwardRef(function PhoneField(
  { label, name, value = '', onChange, error, hint, id, className = '', dialCode = '+91', ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const maxLength = 10;

  function handleChange(event) {
    // Keep digits only and stop at ten, so a paste cannot overflow either.
    const digits = event.target.value.replace(/\D/g, '').slice(0, maxLength);
    onChange({ target: { name, value: digits } });
  }

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-[0.8rem] font-medium tracking-[0.01em] text-ink-soft"
      >
        {label}
      </label>

      <div
        className={[
          'flex h-11 w-full overflow-hidden rounded-field border bg-surface shadow-field',
          'transition-[border-color,box-shadow] duration-150',
          'focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10',
          error
            ? 'border-danger/70 focus-within:border-danger focus-within:ring-danger/10'
            : 'border-line hover:border-line-strong'
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className="flex shrink-0 select-none items-center border-r border-line bg-canvas px-3 text-[0.95rem] text-muted"
        >
          {dialCode}
        </span>
        <input
          ref={ref}
          id={fieldId}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className="h-full w-full bg-transparent px-3.5 text-[0.95rem] text-ink placeholder:text-muted focus:outline-none"
          {...props}
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

export default PhoneField;
