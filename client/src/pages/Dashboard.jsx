import { useEffect, useState } from 'react';
import { CalendarDays, ListChecks, Store, Users } from 'lucide-react';
import ActionFeed from '../components/dashboard/ActionFeed.jsx';
import BudgetPanel from '../components/dashboard/BudgetPanel.jsx';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton.jsx';
import EmptyWorkspace from '../components/dashboard/EmptyWorkspace.jsx';
import NextEvents from '../components/dashboard/NextEvents.jsx';
import PipelinePanel from '../components/dashboard/PipelinePanel.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useDashboardSummary from '../hooks/useDashboardSummary.js';
import { regenerateActions, updateAction } from '../api/actions.js';
import getErrorMessage from '../lib/apiError.js';
import { firstNameOf, formatCount, formatToday, timeGreeting } from '../lib/format.js';
import usePageTitle from '../lib/usePageTitle.js';

// One sentence that says what the numbers mean, in the planner's words.
function summaryLine(data) {
  if (!data) return '';
  const parts = [];
  if (data.events.upcoming) {
    parts.push(`${formatCount(data.events.upcoming, 'event', 'events')} coming up`);
  }
  if (data.actions.open) {
    parts.push(`${formatCount(data.actions.open, 'open action', 'open actions')}`);
  }
  if (data.actions.overdue) parts.push(`${data.actions.overdue} overdue`);
  return parts.length ? parts.join(' · ') : 'Nothing is due right now. A good day to plan ahead.';
}

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const { data, loading, error, reload } = useDashboardSummary();

  const [regenerating, setRegenerating] = useState(false);
  const [completingId, setCompletingId] = useState('');
  const [notice, setNotice] = useState({ text: '', tone: 'muted' });

  // Notices are confirmations, not logs; they clear themselves.
  useEffect(() => {
    if (!notice.text) return undefined;
    const timer = setTimeout(() => setNotice({ text: '', tone: 'muted' }), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const result = await regenerateActions();
      setNotice({
        text: result.created
          ? `${formatCount(result.created, 'new suggestion', 'new suggestions')} added.`
          : 'Suggestions are up to date.',
        tone: 'muted'
      });
      reload();
    } catch (requestError) {
      setNotice({
        text: getErrorMessage(requestError, 'Could not refresh suggestions. Try again.'),
        tone: 'danger'
      });
    } finally {
      setRegenerating(false);
    }
  }

  async function handleComplete(action) {
    setCompletingId(action._id);
    try {
      await updateAction(action._id, { status: 'done' });
      setNotice({ text: 'Action marked as done.', tone: 'muted' });
      reload();
    } catch (requestError) {
      setNotice({
        text: getErrorMessage(requestError, 'Could not update that action. Try again.'),
        tone: 'danger'
      });
    } finally {
      setCompletingId('');
    }
  }

  const isEmptyWorkspace =
    data && data.events.total === 0 && data.clients.total === 0 && data.vendors.total === 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-muted">
          {formatToday()}
        </p>
        <h1 className="mt-2 font-display text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-ink sm:text-[2.5rem]">
          {timeGreeting()}, {firstNameOf(user?.name)}.
        </h1>
        <p className="mt-2 min-h-[1.4rem] text-[0.92rem] leading-relaxed text-muted">
          {loading && !data ? 'Gathering your events and actions…' : summaryLine(data)}
        </p>
      </header>

      <p
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-sm justify-center lg:bottom-6"
      >
        {notice.text ? (
          <span
            className={`rounded-card border bg-surface px-4 py-2.5 text-[0.83rem] leading-snug shadow-card ${
              notice.tone === 'danger' ? 'border-danger/25 text-danger' : 'border-line text-ink-soft'
            }`}
          >
            {notice.text}
          </span>
        ) : null}
      </p>

      {error && data ? (
        <p className="rounded-field border border-danger/20 bg-danger/[0.05] px-3.5 py-2.5 text-[0.8rem] leading-snug text-danger">
          {error} Showing the last data that loaded.
        </p>
      ) : null}

      {error && !data ? (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="text-[0.95rem] font-semibold text-ink">Your dashboard did not load</h2>
          <p className="mt-2 max-w-[46ch] text-[0.85rem] leading-relaxed text-muted">{error}</p>
          <Button size="sm" className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : loading && !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          {isEmptyWorkspace ? <EmptyWorkspace /> : null}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Upcoming"
              value={data.events.upcoming}
              meta={`${formatCount(data.events.total, 'event', 'events')} in total`}
              to="/events"
              icon={CalendarDays}
            />
            <StatCard
              label="Open actions"
              value={data.actions.open}
              meta={
                data.actions.overdue ? (
                  <span className="text-danger">
                    {formatCount(data.actions.overdue, 'overdue', 'overdue')}
                  </span>
                ) : data.actions.dueToday ? (
                  `${formatCount(data.actions.dueToday, 'due today', 'due today')}`
                ) : (
                  'Nothing overdue'
                )
              }
              to="/actions"
              icon={ListChecks}
            />
            <StatCard
              label="Vendors booked"
              value={data.vendors.assignments.booked}
              meta={`${formatCount(data.vendors.total, 'vendor', 'vendors')} saved`}
              to="/vendors"
              icon={Store}
            />
            <StatCard
              label="Clients"
              value={data.clients.total}
              meta="Everyone you plan for"
              to="/clients"
              icon={Users}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <NextEvents events={data.events.next} />
            <ActionFeed
              actions={data.actions.next}
              openCount={data.actions.open}
              onComplete={handleComplete}
              completingId={completingId}
              onRegenerate={handleRegenerate}
              regenerating={regenerating}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <BudgetPanel budgets={data.budget.byCurrency} />
            <PipelinePanel byStatus={data.events.byStatus} />
          </div>
        </>
      )}
    </div>
  );
}
