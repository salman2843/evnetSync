import { CalendarDays, ListChecks, MapPin, StickyNote, Users, Wallet } from 'lucide-react';
import { budgetProgress } from '../../lib/events.js';
import { formatEventDateTime, formatMoney } from '../../lib/format.js';

function DetailItem({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-muted">
        <Icon size={13} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">{children}</dd>
    </div>
  );
}

// The overview is the part of the event a planner checks most: when it is, who
// it is for, where it happens, and how the money and checklist are tracking.
export default function EventOverview({ event, tasks, onOpenTasks, onUpdateBudget }) {
  const budget = budgetProgress(event);
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const client = event.clientId;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section
        id="event-panel-overview"
        role="tabpanel"
        aria-labelledby="event-tab-overview"
        className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <h2 className="font-display text-[1.25rem] leading-tight tracking-[-0.01em] text-ink">
          At a glance
        </h2>

        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <DetailItem icon={CalendarDays} label="Date and time">
            {formatEventDateTime(event.startAt)}
          </DetailItem>

          <DetailItem icon={Users} label="Client">
            {client?.name || 'No client'}
            {client?.phone ? (
              <span className="mt-0.5 block text-[0.82rem] text-muted">{client.phone}</span>
            ) : null}
          </DetailItem>

          <DetailItem icon={MapPin} label="Venue">
            {event.venue?.name ? (
              <>
                {event.venue.name}
                {event.venue.address ? (
                  <span className="mt-0.5 block text-[0.82rem] leading-relaxed text-muted">
                    {event.venue.address}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-muted">Not set</span>
            )}
          </DetailItem>

          <DetailItem icon={Wallet} label="Budget">
            {budget.amount || budget.spent ? (
              <>
                <span className="block">
                  {budget.amount ? formatMoney(budget.amount, budget.currency) : 'No budget set'}
                </span>
                <span className="mt-0.5 block text-[0.82rem] text-muted">
                  {formatMoney(budget.spent, budget.currency)} spent ·{' '}
                  {budget.over ? (
                    <span className="text-danger">
                      {formatMoney(budget.over, budget.currency)} over
                    </span>
                  ) : (
                    `${formatMoney(budget.remaining, budget.currency)} left`
                  )}
                </span>
                {budget.amount ? (
                  <span
                    className="mt-2 block h-1.5 w-full max-w-[13rem] overflow-hidden rounded-full bg-line"
                    aria-hidden="true"
                  >
                    <span
                      className={`block h-full rounded-full ${
                        budget.over ? 'bg-danger' : 'bg-brand'
                      }`}
                      style={{ width: `${budget.percent}%` }}
                    />
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-muted">Not set</span>
            )}
            <button
              type="button"
              onClick={onUpdateBudget}
              className="mt-2 flex w-fit h-8 items-center text-[0.82rem] font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              Update budget
            </button>
          </DetailItem>
        </dl>
      </section>

      <div className="space-y-4">
        <section className="rounded-card border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-[1.1rem] leading-tight text-ink">
              <ListChecks size={16} aria-hidden="true" />
              Checklist
            </h2>
            <p className="text-[0.8rem] text-muted">
              {total ? `${completed}/${total}` : 'None'}
            </p>
          </div>

          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
            {total
              ? `${completed} of ${total} steps done.`
              : 'No tasks on this event yet. The task list arrives next.'}
          </p>

          {total ? (
            <span
              className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-line"
              aria-hidden="true"
            >
              <span className="block h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
            </span>
          ) : null}

          <button
            type="button"
            onClick={onOpenTasks}
            className="mt-3 inline-flex h-9 items-center text-[0.82rem] font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Open tasks
          </button>
        </section>

        <section className="rounded-card border border-line bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-[1.1rem] leading-tight text-ink">
            <StickyNote size={16} aria-hidden="true" />
            Notes
          </h2>
          <p
            className={`mt-2 whitespace-pre-line text-[0.88rem] leading-relaxed ${
              event.notes ? 'text-ink-soft' : 'text-muted'
            }`}
          >
            {event.notes || 'No notes yet. Edit the event to add context for the team.'}
          </p>
        </section>
      </div>
    </div>
  );
}
