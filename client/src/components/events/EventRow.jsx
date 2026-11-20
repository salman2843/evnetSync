import { Link } from 'react-router-dom';
import { ArrowRight, ListChecks, Wallet } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { budgetProgress, taskProgress } from '../../lib/events.js';
import { eventDateParts, formatEventDate, formatMoney } from '../../lib/format.js';
import { eventStatus, eventTypeLabel } from '../../lib/labels.js';

// One event on the month timeline. The date block, progress and budget are
// visible at a glance; the whole row is the link.
export default function EventRow({ event }) {
  const { day, month } = eventDateParts(event.startAt);
  const status = eventStatus(event.status);
  const tasks = taskProgress(event);
  const budget = budgetProgress(event);

  return (
    <li>
      <Link
        to={`/events/${event._id}`}
        className="group flex items-start gap-4 rounded-field px-2 py-3.5 transition-colors duration-150 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <time
          dateTime={event.startAt}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-field border border-line bg-canvas text-center leading-none"
        >
          <span className="sr-only">{formatEventDate(event.startAt)}</span>
          <span aria-hidden="true" className="font-display text-[1.25rem] text-ink">
            {day}
          </span>
          <span
            aria-hidden="true"
            className="mt-0.5 text-[0.68rem] uppercase tracking-[0.08em] text-muted"
          >
            {month}
          </span>
        </time>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <p className="truncate text-[0.95rem] font-medium text-ink">{event.title}</p>
              <p className="mt-1 truncate text-[0.83rem] text-muted">
                {[event.clientId?.name, eventTypeLabel(event.eventTypeId)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <Badge tone={status.tone} className="hidden shrink-0 sm:inline-flex">
              {status.label}
            </Badge>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8rem] text-muted">
            <Badge tone={status.tone} className="sm:hidden">
              {status.label}
            </Badge>

            <span className="inline-flex items-center gap-1.5">
              <ListChecks size={13} aria-hidden="true" />
              {tasks.total ? `${tasks.completed}/${tasks.total} tasks` : 'No tasks'}
              {tasks.total ? (
                <span
                  className="hidden h-1 w-14 overflow-hidden rounded-full bg-line sm:inline-block"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full rounded-full bg-brand"
                    style={{ width: `${tasks.percent}%` }}
                  />
                </span>
              ) : null}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Wallet size={13} aria-hidden="true" />
              {budget.amount ? formatMoney(budget.amount, budget.currency) : 'No budget'}
            </span>
          </div>
        </div>

        <ArrowRight
          size={15}
          aria-hidden="true"
          className="mt-1 hidden shrink-0 text-line-strong transition-colors group-hover:text-muted sm:block"
        />
      </Link>
    </li>
  );
}
