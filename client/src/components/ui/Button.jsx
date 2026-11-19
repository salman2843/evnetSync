import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const SIZES = {
  md: 'h-11 px-5 text-[0.95rem]',
  // Small buttons stay compact on a mouse but keep a 44px target on a phone.
  sm: 'h-11 px-3.5 text-sm sm:h-9'
};

const VARIANTS = {
  primary:
    'bg-brand text-white shadow-button hover:bg-brand-hover focus-visible:ring-brand',
  ghost:
    'text-ink-soft hover:bg-wash focus-visible:ring-brand/40'
};

// One button for the whole app. Pass `href` when the action is a link (WhatsApp,
// tel:, mailto:) so the same look is never copied into a page. Loading keeps the
// label in place so the button does not change width while the request is in
// flight.
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    className = '',
    children,
    disabled,
    type = 'button',
    href,
    ...props
  },
  ref
) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-field font-medium',
    'transition-[background-color,transform] duration-150 active:translate-y-px',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    'disabled:pointer-events-none disabled:opacity-60',
    SIZES[size],
    VARIANTS[variant],
    className
  ].join(' ');

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} aria-busy={loading || undefined} {...props}>
        {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

export default Button;
