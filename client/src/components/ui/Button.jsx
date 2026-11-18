import { Loader2 } from 'lucide-react';

const SIZES = {
  md: 'h-11 px-5 text-[0.95rem]',
  sm: 'h-9 px-3.5 text-sm'
};

const VARIANTS = {
  primary:
    'bg-brand text-white shadow-button hover:bg-brand-hover focus-visible:ring-brand',
  ghost:
    'text-ink-soft hover:bg-wash focus-visible:ring-brand/40'
};

// One button for the whole app. Loading keeps the label in place so the button
// does not change width while the request is in flight.
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-field font-medium',
    'transition-[background-color,transform] duration-150 active:translate-y-px',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    'disabled:pointer-events-none disabled:opacity-60',
    SIZES[size],
    VARIANTS[variant],
    className
  ].join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
