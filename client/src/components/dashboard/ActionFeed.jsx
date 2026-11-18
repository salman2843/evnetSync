import { Link } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Panel from '../ui/Panel.jsx';
import { describeDue } from '../../lib/format.js';
import { ACTION_PRIORITY } from '../../lib/labels.js';

function ActionRow({ action, onComplete, completing }) {
  const due = describeDue(action.dueAt);
  const priority = ACTION_PRIORITY[action.priority] || ACTION_PRIORITY.normal;

  return (
    <li className="group flex items-start gap-3 px-2 py-3">
      <button
        type="button"
        onClick={() => onComplete(action)}
        disabled={completing}
        aria-label={`Mark "${action.title}" as done`}
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-strong text-transparent transition-colors duration-150 hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
      >
        {completing ? (
          <Loader2 size={12} className="animate-spin text-brand" aria-hidden="true" />
        ) : (
          <Check size={13} strokeWidth={2.5} aria-hidden="true" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-[0.88rem] leading-snug text-ink">{action.title}</p>
        <p className="mt-1 flex items-center gap-2 text-[0.75rem] text-muted">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${priority.dot}`} aria-hidden="true" />
          <span className="truncate">
            {action.eventId?.title || 'No event'}
            <span className="sr-only"> · {priority.label} priority</span>
          </span>
        </p>
      </div>

      <Badge tone={due.tone === 'muted' ? 'neutral' : due.tone} className="mt-0.5 shrink-0">
        {due.text}
      </Badge>
    </li>
  );
}

export default function ActionFeed({
  actions,
  openCount,
  onComplete,
  completingId,
  onRegenerate,
  regenerating
}) {
  return (
    <Panel
      id="action-center"
      title="Action center"
      description={`${openCount} open ${openCount === 1 ? 'action' : 'actions'} across your events.`}
      action={
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-field px-2.5 text-[0.78rem] font-medium text-ink-soft transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
        >
          <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} aria-hidden="true" />
          {regenerating ? 'Checking…' : 'Refresh'}
        </button>
      }
      bodyClassName={actions.length ? 'px-3 py-2' : 'p-5'}
      footer={
        <Link
          to="/actions"
          className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-brand transition-colors hover:text-brand-hover"
        >
          All actions
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      }
    >
      {actions.length ? (
        <ul className="divide-y divide-line">
          {actions.map((action) => (
            <ActionRow
              key={action._id}
              action={action}
              onComplete={onComplete}
              completing={completingId === action._id}
            />
          ))}
        </ul>
      ) : (
        <div className="flex items-start gap-2.5">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
          <p className="text-[0.85rem] leading-relaxed text-muted">
            Nothing needs you right now. New suggestions appear as event dates get closer.
          </p>
        </div>
      )}
    </Panel>
  );
}
