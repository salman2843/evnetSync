import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy, Pencil, Trash2 } from 'lucide-react';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Drawer from '../components/ui/Drawer.jsx';
import Toast from '../components/ui/Toast.jsx';
import EventDetailSkeleton from '../components/events/EventDetailSkeleton.jsx';
import EventDetailTabs from '../components/events/EventDetailTabs.jsx';
import EventForm from '../components/events/EventForm.jsx';
import EventOverview from '../components/events/EventOverview.jsx';
import EventTasksPanel from '../components/events/EventTasksPanel.jsx';
import EventVendorsPanel from '../components/events/EventVendorsPanel.jsx';
import EventActionsPanel from '../components/events/EventActionsPanel.jsx';
import BudgetUpdateDialog from '../components/events/BudgetUpdateDialog.jsx';
import { deleteEvent, duplicateEvent } from '../api/events.js';
import useEvent from '../hooks/useEvent.js';
import useToast from '../hooks/useToast.js';
import getErrorMessage from '../lib/apiError.js';
import { formatEventDate, formatMoney } from '../lib/format.js';
import { eventStatus, eventTypeLabel } from '../lib/labels.js';
import usePageTitle from '../lib/usePageTitle.js';

const TAB_IDS = ['overview', 'tasks', 'vendors', 'actions'];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab = TAB_IDS.includes(requestedTab) ? requestedTab : 'overview';

  const { event, tasks, loading, error, status, reload } = useEvent(id);
  usePageTitle(event ? event.title : 'Event');
  const { notice, notify } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  function changeTab(next) {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'overview') nextParams.delete('tab');
    else nextParams.set('tab', next);
    setSearchParams(nextParams, { replace: true });
    // The tab bar is sticky, so without this a tap near the bottom would swap
    // the panel above the planner's viewport.
    window.scrollTo({ top: 0 });
  }

  function handleSaved(_result, wasEditing) {
    setFormOpen(false);
    notify(wasEditing ? 'Event saved.' : 'Event created.');
    reload();
  }

  // Over-budget is a valid state, but the planner should hear about it in the
  // same breath as the confirmation.
  function handleBudgetSaved(updated) {
    setBudgetOpen(false);
    const amount = Number(updated.budget?.amount || 0);
    const spent = Number(updated.budget?.spent || 0);
    const over = Math.max(spent - amount, 0);
    notify(
      over
        ? `Budget updated. This event is now ${formatMoney(over)} over budget.`
        : 'Budget updated.',
      over ? 'danger' : 'muted'
    );
    reload();
  }

  async function handleDuplicate() {
    if (!event || duplicating) return;
    setDuplicating(true);
    try {
      const result = await duplicateEvent(event._id);
      notify('Event duplicated.');
      navigate(`/events/${result.event._id}`);
    } catch (requestError) {
      notify(getErrorMessage(requestError, 'Could not duplicate this event. Try again.'), 'danger');
    } finally {
      setDuplicating(false);
    }
  }

  function askDelete() {
    setDeleteError('');
    setDeleteOpen(true);
  }

  function cancelDelete() {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setDeleteError('');
  }

  async function confirmDelete() {
    if (!event || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteEvent(event._id);
      navigate('/events', { replace: true });
    } catch (requestError) {
      setDeleteError(getErrorMessage(requestError, 'Could not delete this event. Try again.'));
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading && !event) return <EventDetailSkeleton />;

  if (!event) {
    // A malformed id is a 400 and a missing event is a 404; both mean there is
    // nothing to open, so they share the "not found" screen.
    const missing = status === 404 || status === 400;
    return (
      <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="font-display text-[1.6rem] leading-tight text-ink">
          {missing ? 'Event not found' : 'This event did not load'}
        </h1>
        <p className="mt-2 max-w-[46ch] text-[0.9rem] leading-relaxed text-muted">
          {missing
            ? 'It may have been deleted, or the link belongs to another planner.'
            : error}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {!missing ? (
            <Button size="sm" onClick={reload}>
              Try again
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => navigate('/events')}>
            Back to events
          </Button>
        </div>
      </div>
    );
  }

  const statusMeta = eventStatus(event.status);

  return (
    <div className="space-y-5">
      <Toast text={notice.text} tone={notice.tone} />

      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-[0.85rem] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        All events
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            <span className="text-[0.8rem] text-muted">{eventTypeLabel(event.eventTypeId, event.customEventType)}</span>
          </div>
          <h1 className="mt-2 font-display text-[1.9rem] leading-[1.1] tracking-[-0.02em] text-ink sm:text-[2.2rem]">
            {event.title}
          </h1>
          <p className="mt-1.5 text-[0.88rem] text-muted">
            {[event.clientId?.name, formatEventDate(event.startAt)].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setFormOpen(true)}>
            <Pencil size={15} aria-hidden="true" />
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDuplicate} loading={duplicating}>
            <Copy size={15} aria-hidden="true" />
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={askDelete}
            className="text-danger hover:bg-danger/[0.06] hover:text-danger focus-visible:ring-danger/40"
          >
            <Trash2 size={15} aria-hidden="true" />
            Delete
          </Button>
        </div>
      </header>

      <EventDetailTabs active={tab} onChange={changeTab} />

      {tab === 'overview' ? (
        <EventOverview
          event={event}
          tasks={tasks}
          onOpenTasks={() => changeTab('tasks')}
          onUpdateBudget={() => setBudgetOpen(true)}
        />
      ) : tab === 'tasks' ? (
        <EventTasksPanel
          event={event}
          tasks={tasks}
          onChanged={reload}
          notify={notify}
        />
      ) : tab === 'vendors' ? (
        <EventVendorsPanel event={event} notify={notify} />
      ) : (
        <EventActionsPanel event={event} notify={notify} />
      )}

      <BudgetUpdateDialog
        open={budgetOpen}
        event={event}
        onClose={() => setBudgetOpen(false)}
        onSaved={handleBudgetSaved}
      />

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Edit event"
        description="Update the date, venue, budget or status."
        bodyClassName="min-h-0 flex-1 overflow-hidden p-0"
      >
        <EventForm
          key={event._id}
          event={event}
          onSaved={handleSaved}
          onCancel={() => setFormOpen(false)}
        />
      </Drawer>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this event?"
        description={`${event.title} will be removed with its tasks and vendor assignments. This cannot be undone.`}
        confirmLabel="Delete event"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
