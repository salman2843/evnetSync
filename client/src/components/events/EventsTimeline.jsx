import EventRow from './EventRow.jsx';
import { groupEventsByMonth } from '../../lib/events.js';
import { formatCount } from '../../lib/format.js';

// Month headings with a single raised sheet per month. The server already
// sorted the list, so this only inserts the headings.
export default function EventsTimeline({ events }) {
  const groups = groupEventsByMonth(events);

  return (
    <div className="space-y-7">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`month-${group.key}`}>
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2
              id={`month-${group.key}`}
              className="font-display text-[1.25rem] leading-tight tracking-[-0.01em] text-ink"
            >
              {group.label}
            </h2>
            <p className="text-[0.8rem] text-muted">
              {formatCount(group.events.length, 'event', 'events')}
            </p>
          </div>

          <div className="mt-3 rounded-card border border-line bg-surface px-2 py-1 shadow-card">
            <ul className="divide-y divide-line">
              {group.events.map((event) => (
                <EventRow key={event._id} event={event} />
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
