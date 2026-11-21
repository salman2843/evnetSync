import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ListChecks, Wallet } from 'lucide-react';
import { budgetProgress, countdownDays, taskProgress } from '../../lib/events.js';
import { formatEventDate, formatMoney } from '../../lib/format.js';
import { eventTypeLabel } from '../../lib/labels.js';

// The one brand moment on the screen: the next event, in ink, with the
// countdown set in the display face. This is the authored entrance.
export default function EventSpotlight({ event }) {
  const days = countdownDays(event.startAt);
  const tasks = taskProgress(event);
  const budget = budgetProgress(event);
  const countdown = days === 0 ? 'Today' : String(days);
  const unit = days === 0 ? 'the day is here' : days === 1 ? 'day to go' : 'days to go';

  return (
    <Link
      to={`/events/${event._id}`}
      className="panel-enter group block rounded-card border border-ink bg-ink text-onInk shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-onInk-muted">
          Next event
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="flex items-baseline gap-2">
              <span
                className={`font-display leading-none tracking-[-0.03em] text-onInk ${
                  days === 0 ? 'text-[2.5rem]' : 'text-[3.2rem]'
                }`}
              >
                {countdown}
              </span>
              <span className="text-[0.9rem] text-onInk-soft">{unit}</span>
            </p>
            <h2 className="mt-3 font-display text-[1.45rem] leading-tight tracking-[-0.01em] sm:text-[1.7rem]">
              {event.title}
            </h2>
            <p className="mt-1 text-[0.88rem] text-onInk-muted">
              {[event.clientId?.name, eventTypeLabel(event.eventTypeId, event.customEventType)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 pb-0.5 text-[0.85rem] font-medium text-brand-tint transition-transform duration-150 group-hover:translate-x-1">
            Open event
            <ArrowRight size={14} aria-hidden="true" />
          </span>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-onInk/10 pt-4 sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.1em] text-onInk-muted">
              <CalendarDays size={13} aria-hidden="true" />
              Date
            </dt>
            <dd className="mt-1 text-[0.9rem] text-onInk-soft">
              {formatEventDate(event.startAt)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.1em] text-onInk-muted">
              <ListChecks size={13} aria-hidden="true" />
              Tasks
            </dt>
            <dd className="mt-1 text-[0.9rem] text-onInk-soft">
              {tasks.total ? `${tasks.completed} of ${tasks.total} done` : 'No tasks yet'}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.1em] text-onInk-muted">
              <Wallet size={13} aria-hidden="true" />
              Budget
            </dt>
            <dd className="mt-1 text-[0.9rem] text-onInk-soft">
              {budget.amount ? formatMoney(budget.amount, budget.currency) : 'Not set'}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
