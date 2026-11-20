import { CalendarDays } from 'lucide-react';
import Button from '../ui/Button.jsx';

// One empty state, with the copy and the next action chosen by the page. The
// calendar has four different "nothing here" situations, so the page owns the
// wording and this component owns the shape.
export default function EventsEmpty({
  icon: Icon = CalendarDays,
  title,
  description,
  actionLabel,
  onAction
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon size={20} aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-[1.4rem] leading-tight text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-[40ch] text-[0.88rem] leading-relaxed text-muted">
        {description}
      </p>
      {actionLabel ? (
        <Button variant="ghost" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
