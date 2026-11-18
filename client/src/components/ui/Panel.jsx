// The one raised surface in the app: hairline border, white fill, optional
// heading and footer. Nested panels are not allowed; split content instead.
export default function Panel({
  id,
  title,
  description,
  action,
  footer,
  className = '',
  bodyClassName = 'p-5',
  children
}) {
  return (
    <section
      id={id}
      aria-labelledby={id && title ? `${id}-title` : undefined}
      className={`rounded-card border border-line bg-surface shadow-card ${className}`}
    >
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2
              id={id ? `${id}-title` : undefined}
              className="text-[0.95rem] font-semibold tracking-[-0.005em] text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[0.8rem] leading-snug text-muted">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}

      <div className={bodyClassName}>{children}</div>

      {footer ? <div className="border-t border-line px-5 py-3">{footer}</div> : null}
    </section>
  );
}
