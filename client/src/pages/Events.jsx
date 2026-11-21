import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Search } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Drawer from '../components/ui/Drawer.jsx';
import Toast from '../components/ui/Toast.jsx';
import EventForm from '../components/events/EventForm.jsx';
import EventsEmpty from '../components/events/EventsEmpty.jsx';
import EventsSkeleton from '../components/events/EventsSkeleton.jsx';
import EventsTimeline from '../components/events/EventsTimeline.jsx';
import EventsToolbar from '../components/events/EventsToolbar.jsx';
import EventSpotlight from '../components/events/EventSpotlight.jsx';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import useEvents from '../hooks/useEvents.js';
import useToast from '../hooks/useToast.js';
import { nextUpcomingEvent } from '../lib/events.js';
import usePageTitle from '../lib/usePageTitle.js';

export default function Events() {
  usePageTitle('Events');
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('upcoming');
  const [formOpen, setFormOpen] = useState(false);
  const search = useDebouncedValue(searchInput.trim(), 300);

  const { events, loading, error, reload } = useEvents({ search, status, scope });
  const { notice, notify } = useToast();
  const spotlight = useMemo(() => nextUpcomingEvent(events), [events]);

  const filtersActive = Boolean(search) || Boolean(status);

  function clearFilters() {
    setSearchInput('');
    setStatus('');
  }

  // The new event opens on its own screen so the planner can check the generated
  // checklist straight away.
  function handleSaved(result) {
    setFormOpen(false);
    const suggested = result.tasks?.length || 0;
    notify(suggested ? `Event created with ${suggested} suggested tasks.` : 'Event created.');
    navigate(`/events/${result.event._id}`);
  }

  // The calendar can be empty for four different reasons, so each gets its own
  // sentence and its own next action.
  const emptyState = filtersActive
    ? {
        icon: Search,
        title: 'No events match',
        description:
          'Try another event or client name, a different status, or clear the filters to see the whole calendar.',
        actionLabel: 'Clear filters',
        onAction: clearFilters
      }
    : scope === 'upcoming'
      ? {
          icon: CalendarDays,
          title: 'Nothing coming up',
          description:
            'There are no events from today onwards. Anything already finished is still in the archive.',
          actionLabel: 'Show past events',
          onAction: () => setScope('past')
        }
      : scope === 'past'
        ? {
            icon: CalendarDays,
            title: 'No past events',
            description: 'Everything on your calendar is still ahead.',
            actionLabel: 'Show upcoming events',
            onAction: () => setScope('upcoming')
          }
        : {
            icon: CalendarDays,
            title: 'Your calendar is empty',
            description:
              'Start with a client, then their event will live here, grouped by month with its tasks and budget.',
            actionLabel: 'Go to clients',
            onAction: () => navigate('/clients')
          };

  const isEmpty = !loading && events.length === 0;

  return (
    <div className="space-y-6">
      <Toast text={notice.text} tone={notice.tone} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted">
            The calendar
          </p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-ink sm:text-[2.4rem]">
            Events
          </h1>
          <p className="mt-2 max-w-[52ch] text-[0.92rem] leading-relaxed text-muted">
            Every date on the books, from first inquiry to the final run sheet.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          New event
        </Button>
      </header>

      <EventsToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={setStatus}
        scope={scope}
        onScopeChange={setScope}
        count={events.length}
        loading={loading}
      />

      {error && events.length ? (
        <p className="rounded-field border border-danger/20 bg-danger/[0.05] px-3.5 py-2.5 text-[0.8rem] leading-snug text-danger">
          {error} Showing the last list that loaded.
        </p>
      ) : null}

      {error && !events.length && !loading ? (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="text-[0.95rem] font-semibold text-ink">Your events did not load</h2>
          <p className="mt-2 max-w-[46ch] text-[0.85rem] leading-relaxed text-muted">{error}</p>
          <Button size="sm" className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : loading && !events.length ? (
        <EventsSkeleton />
      ) : isEmpty ? (
        <EventsEmpty {...emptyState} />
      ) : (
        <>
          {spotlight ? <EventSpotlight event={spotlight} /> : null}
          <EventsTimeline events={events} />
        </>
      )}

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New event"
        description="Pick the client, date and type. The suggested checklist can be added with it."
        bodyClassName="min-h-0 flex-1 overflow-hidden p-0"
      >
        <EventForm onSaved={handleSaved} onCancel={() => setFormOpen(false)} />
      </Drawer>
    </div>
  );
}
