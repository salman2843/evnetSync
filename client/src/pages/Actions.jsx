import { useState } from 'react';
import { CheckCircle2, ListChecks, Plus, RefreshCw } from 'lucide-react';
import ActionFilters from '../components/actions/ActionFilters.jsx';
import ActionList from '../components/actions/ActionList.jsx';
import AddActionForm from '../components/actions/AddActionForm.jsx';
import Button from '../components/ui/Button.jsx';
import Drawer from '../components/ui/Drawer.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Toast from '../components/ui/Toast.jsx';
import useActionList from '../hooks/useActionList.js';
import useToast from '../hooks/useToast.js';
import { regenerateActions, updateAction } from '../api/actions.js';
import getErrorMessage from '../lib/apiError.js';
import { actionCounts, filterActions } from '../lib/actionFilters.js';
import { formatCount } from '../lib/format.js';
import usePageTitle from '../lib/usePageTitle.js';

const EMPTY_COPY = {
  open: {
    title: 'All clear',
    description: 'Nothing is open right now. Finished items stay under Done.'
  },
  overdue: {
    title: 'Nothing overdue',
    description: 'Every open action is still on schedule. Keep it that way.'
  },
  today: {
    title: 'Nothing due today',
    description: 'Today is clear. The next deadline is further down the calendar.'
  },
  week: {
    title: 'The week is clear',
    description: 'No action is due over the next seven days.'
  },
  done: {
    title: 'No finished actions yet',
    description: 'Actions you complete or dismiss will be kept here as history.'
  }
};

function summaryLine(counts, loading) {
  if (loading) return 'Gathering everything that needs you…';
  if (!counts.open) return 'Nothing is open. Every action is done or dismissed.';

  const parts = [formatCount(counts.open, 'open action', 'open actions')];
  if (counts.overdue) parts.push(`${counts.overdue} overdue`);
  else if (counts.today) parts.push(`${counts.today} due today`);
  return parts.join(' · ');
}

export default function Actions() {
  usePageTitle('Actions');

  const { actions, loading, error, reload } = useActionList();
  const { notice, notify } = useToast();
  const [filter, setFilter] = useState('open');
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const counts = actionCounts(actions);
  const visible = filterActions(actions, filter);
  const hasAny = actions.length > 0;
  const empty = EMPTY_COPY[filter] || EMPTY_COPY.open;

  async function handleToggle(action) {
    if (busyId) return;
    setBusyId(action._id);
    try {
      await updateAction(action._id, {
        status: action.status === 'open' ? 'done' : 'open'
      });
      notify(action.status === 'open' ? 'Action done.' : 'Action reopened.');
      reload();
    } catch (requestError) {
      notify(getErrorMessage(requestError, 'Could not update this action. Try again.'), 'danger');
    } finally {
      setBusyId('');
    }
  }

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const result = await regenerateActions();
      notify(
        result.created
          ? `${formatCount(result.created, 'new suggestion', 'new suggestions')} added.`
          : 'Your suggestions are up to date.'
      );
      reload();
    } catch (requestError) {
      notify(
        getErrorMessage(requestError, 'Could not refresh suggestions. Try again.'),
        'danger'
      );
    } finally {
      setRefreshing(false);
    }
  }

  function handleSaved(action) {
    setFormOpen(false);
    setFilter('open');
    const eventTitle = action?.eventId?.title;
    notify(eventTitle ? `Action added to ${eventTitle}.` : 'Action added.');
    reload();
  }

  return (
    <div className="space-y-6">
      <Toast text={notice.text} tone={notice.tone} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted">
            Across every event
          </p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-ink sm:text-[2.4rem]">
            Action center
          </h1>
          <p className="mt-2 min-h-[1.4rem] max-w-[52ch] text-[0.92rem] leading-relaxed text-muted">
            {summaryLine(counts, loading && !hasAny)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            Add action
          </Button>
          <Button size="sm" variant="ghost" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw size={15} aria-hidden="true" />
            Refresh suggestions
          </Button>
        </div>
      </header>

      {error && hasAny ? (
        <p className="rounded-field border border-danger/20 bg-danger/[0.05] px-3.5 py-2.5 text-[0.8rem] leading-snug text-danger">
          {error} Showing the last list that loaded.
        </p>
      ) : null}

      {error && !hasAny && !loading ? (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="text-[0.95rem] font-semibold text-ink">Your actions did not load</h2>
          <p className="mt-2 max-w-[46ch] text-[0.85rem] leading-relaxed text-muted">{error}</p>
          <Button size="sm" className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : loading && !hasAny ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {[0, 1, 2, 3].map((row) => (
            <li key={row} className="space-y-2 px-4 py-4 sm:px-5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-40" />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ActionFilters value={filter} onChange={setFilter} counts={counts} />
            <p className="text-[0.8rem] text-muted" aria-live="polite">
              {hasAny
                ? `${formatCount(visible.length, 'action', 'actions')} shown`
                : 'Nothing here yet'}
            </p>
          </div>

          {visible.length ? (
            <ActionList actions={visible} busyId={busyId} onToggle={handleToggle} />
          ) : (
            <div className="rounded-card border border-line bg-surface p-6 text-center shadow-card sm:p-8">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success/[0.08] text-success">
                {hasAny ? (
                  <CheckCircle2 size={20} aria-hidden="true" />
                ) : (
                  <ListChecks size={20} aria-hidden="true" />
                )}
              </span>
              <h2 className="mt-3 font-display text-[1.2rem] leading-tight text-ink">
                {hasAny ? empty.title : 'Nothing on your list'}
              </h2>
              <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.87rem] leading-relaxed text-muted">
                {hasAny
                  ? empty.description
                  : 'Suggestions appear as event dates get closer. You can also add your own reminder now.'}
              </p>
              {!hasAny ? (
                <Button size="sm" className="mt-4" onClick={() => setFormOpen(true)}>
                  <Plus size={15} aria-hidden="true" />
                  Add your first action
                </Button>
              ) : null}
            </div>
          )}
        </>
      )}

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add action"
        description="A reminder for you. Link it to an event when it belongs to one."
        bodyClassName="min-h-0 flex-1 overflow-hidden p-0"
      >
        <AddActionForm onSaved={handleSaved} onCancel={() => setFormOpen(false)} />
      </Drawer>
    </div>
  );
}
