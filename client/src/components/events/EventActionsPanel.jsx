import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { listActions, regenerateActions, updateAction } from '../../api/actions.js';
import getErrorMessage from '../../lib/apiError.js';
import { describeDue } from '../../lib/format.js';
import { ACTION_PRIORITY } from '../../lib/labels.js';

function ActionRow({ action, busy, onToggle }) {
  const done = action.status !== 'open';
  const due = describeDue(action.dueAt);
  const priority = ACTION_PRIORITY[action.priority] || ACTION_PRIORITY.normal;

  return (
    <li className="flex items-start gap-2.5 px-4 py-3.5 sm:px-5">
      <button
        type="button"
        onClick={() => onToggle(action)}
        disabled={busy}
        aria-label={done ? `Reopen "${action.title}"` : `Mark "${action.title}" as done`}
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
        <p
          className={`text-[0.9rem] font-medium leading-snug ${
            done ? 'text-muted line-through' : 'text-ink'
          }`}
        >
          {action.title}
        </p>
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
          {action.status === 'dismissed' ? <span>Dismissed</span> : null}
        </p>
      </div>

      {done ? (
        <Badge tone="success" className="mt-1 shrink-0">
          {action.status === 'done' ? 'Done' : 'Dismissed'}
        </Badge>
      ) : (
        <Badge
          tone={action.isOverdue ? 'danger' : due.tone === 'muted' ? 'neutral' : due.tone}
          className="mt-1 shrink-0"
        >
          {action.isOverdue ? 'Overdue' : due.text}
        </Badge>
      )}
    </li>
  );
}

// The action feed for one event. Suggestions are generated across the whole
// workspace, so "Check suggestions" refreshes the engine and then shows only
// this event's rows.
export default function EventActionsPanel({ event, notify }) {
  const [state, setState] = useState({ actions: [], loading: true, error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((current) => ({ ...current, loading: true, error: '' }));

    listActions({ eventId: event._id, status: 'all' }, controller.signal)
      .then((actions) => {
        if (!active) return;
        setState({ actions, loading: false, error: '' });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Could not load actions for this event. Try again.')
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [event._id, reloadKey]);

  function reload() {
    setReloadKey((value) => value + 1);
  }

  const openActions = state.actions.filter((action) => action.status === 'open');
  const doneActions = state.actions.filter((action) => action.status !== 'open');
  const overdue = openActions.filter((action) => action.isOverdue).length;

  async function handleToggle(action) {
    if (busyId) return;
    setBusyId(action._id);
    try {
      await updateAction(action._id, {
        status: action.status === 'open' ? 'done' : 'open'
      });
      notify(action.status === 'open' ? 'Action done.' : 'Action reopened.');
      reload();
    } catch (error) {
      notify(getErrorMessage(error, 'Could not update this action. Try again.'), 'danger');
    } finally {
      setBusyId('');
    }
  }

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const summary = await regenerateActions();
      notify(
        summary.total
          ? 'Action suggestions refreshed.'
          : 'Nothing needs a suggestion right now.'
      );
      reload();
    } catch (error) {
      notify(getErrorMessage(error, 'Could not refresh suggestions. Try again.'), 'danger');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-4">
      <section
        id="event-panel-actions"
        role="tabpanel"
        aria-labelledby="event-tab-actions"
        className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[1.35rem] leading-tight text-ink">Actions</h2>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-muted">
              {state.loading
                ? 'Checking what needs you…'
                : openActions.length
                  ? `${openActions.length} open${overdue ? ` · ${overdue} overdue` : ''}`
                  : 'Nothing needs you on this event right now.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            loading={refreshing}
            className="text-brand hover:bg-brand-soft hover:text-brand-hover"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Check suggestions
          </Button>
        </div>
      </section>

      {state.error ? (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="text-[0.95rem] font-semibold text-ink">Actions did not load</h2>
          <p className="mt-2 max-w-[46ch] text-[0.85rem] leading-relaxed text-muted">
            {state.error}
          </p>
          <Button size="sm" className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : state.loading && !state.actions.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {[0, 1, 2].map((row) => (
            <li key={row} className="space-y-2 px-4 py-4 sm:px-5">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-40" />
            </li>
          ))}
        </ul>
      ) : openActions.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {openActions.map((action) => (
            <ActionRow
              key={action._id}
              action={action}
              busy={busyId === action._id}
              onToggle={handleToggle}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-card border border-line bg-surface p-6 text-center shadow-card sm:p-8">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success/[0.08] text-success">
            <CheckCircle2 size={20} aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-display text-[1.2rem] leading-tight text-ink">
            {doneActions.length ? 'All clear here' : 'No actions yet'}
          </h2>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.87rem] leading-relaxed text-muted">
            {doneActions.length
              ? 'Every suggestion for this event is done or dismissed.'
              : 'Suggestions appear as deadlines get closer. You can also ask the engine to check now.'}
          </p>
          {!doneActions.length ? (
            <Button
              size="sm"
              className="mt-4"
              onClick={handleRefresh}
              loading={refreshing}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Check for suggestions
            </Button>
          ) : null}
        </div>
      )}

      {doneActions.length ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <button
            type="button"
            onClick={() => setShowDone((value) => !value)}
            aria-expanded={showDone}
            className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left text-[0.83rem] font-medium text-ink-soft transition-colors hover:bg-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:px-5"
          >
            <span>
              {showDone ? 'Hide' : 'Show'} completed ({doneActions.length})
            </span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`transition-transform duration-150 ${showDone ? 'rotate-180' : ''}`}
            />
          </button>
          {showDone ? (
            <ul className="divide-y divide-line border-t border-line">
              {doneActions.map((action) => (
                <ActionRow
                  key={action._id}
                  action={action}
                  busy={busyId === action._id}
                  onToggle={handleToggle}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
