import { Link } from 'react-router-dom';

// One number per card, with the context that makes it mean something. Whole
// card is a link when there is a screen to open.
export default function StatCard({ label, value, meta, to, icon: Icon }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="block min-h-[1.7rem] text-[0.68rem] font-medium uppercase leading-relaxed tracking-[0.14em] text-muted">
          {label}
        </span>
        {Icon ? <Icon size={16} className="mt-0.5 shrink-0 text-line-strong" aria-hidden="true" /> : null}
      </div>
      <p className="mt-2 font-display text-[2rem] leading-none tracking-[-0.02em] text-ink">
        {value}
      </p>
      {meta ? <p className="mt-2 text-[0.8rem] leading-snug text-muted">{meta}</p> : null}
    </>
  );

  const classes =
    'block rounded-card border border-line bg-surface p-5 shadow-card transition-colors duration-150';

  if (!to) return <div className={classes}>{content}</div>;

  return (
    <Link
      to={to}
      className={`${classes} hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40`}
    >
      {content}
    </Link>
  );
}
