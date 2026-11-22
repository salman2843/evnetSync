import { Link } from 'react-router-dom';
import { Check, Loader2, RotateCcw } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { describeDue } from '../../lib/format.js';
import { ACTION_PRIORITY } from '../../lib/labels.js';

function ActionRow({ action, busy, onToggle }) {
  const done = action.status !== 'open';
  const due = describeDue(action.dueAt);
  const priority = ACTION_PRIORITY[action.priority] || ACTION_PRIORITY.normal;
  const event = action.eventId && typeof action.eventId === 'object' ? action.eventId : null;

  return (
    <li className="flex items-start gap-2.5 px-4 py-3.5 sm:px-5">
      <button
        type="button"
        onClick={() => onToggle(action)}
        disabled={busy}
        aria-label={done ? `Reopen "${action.title}"` : `Mark "${action.title}" as done`}
        aria-pressed={done}
        className="grid h-11 w-11 shrink-0 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
      >
        <span
          className={`grid h-6 w-6 place-items-center rounded-full border transition-colors duration-150 ${
            done
              ? 'border-success/40 bg-success/[0.08] text-success'
              : 'border-line-strong bg-surface text-transparent hover:border-brand hover:text-brand'
          }`}
        >
          {busy ? (
            <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          ) : done ? (
            <RotateCcw size={12} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <Check size={13} strokeWidth={2.5} aria-hidden="true" />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <p
            className={`text-[0.9rem] font-medium leading-snug ${
              done ? 'text-muted line-through' : 'text-ink'
            }`}
          >
            {action.title}
          </p>

          {done ? (
            <Badge tone="success" className="shrink-0 self-start sm:mt-0">
              {action.status === 'done' ? 'Done' : 'Dismissed'}
            </Badge>
          ) : (
            <Badge
              tone={due.tone === 'muted' ? 'neutral' : due.tone}
              className="shrink-0 self-start sm:mt-0"
            >
              {due.text}
            </Badge>
          )}
        </div>

        {action.description ? (
          <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{action.description}</p>
        ) : null}

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${priority.dot}`}
              aria-hidden="true"
            />
            {priority.label}
          </span>
          <span>{action.source === 'rule' ? 'Suggested' : 'Added by you'}</span>
          {event ? (
            <Link
              to={`/events/${event._id}?tab=actions`}
              className="truncate font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {event.title}
            </Link>
          ) : (
            <span>No event</span>
          )}
        </p>
      </div>
    </li>
  );
}

// One list for every filter. The page decides which rows belong here.
export default function ActionList({ actions, busyId, onToggle }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {actions.map((action) => (
        <ActionRow
          key={action._id}
          action={action}
          busy={busyId === action._id}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}
