import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Panel from '../ui/Panel.jsx';
import { eventDateParts, formatEventDate } from '../../lib/format.js';
import { eventStatus, eventTypeLabel } from '../../lib/labels.js';

function EventRow({ event }) {
  const { day, month } = eventDateParts(event.startAt);
  const status = eventStatus(event.status);

  return (
    <li>
      <Link
        to={`/events/${event._id}`}
        className="group flex items-start gap-4 rounded-field px-2 py-3 transition-colors duration-150 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <time
          dateTime={event.startAt}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-field border border-line bg-canvas text-center leading-none"
        >
          <span className="sr-only">{formatEventDate(event.startAt)}</span>
          <span aria-hidden="true" className="font-display text-[1.1rem] text-ink">
            {day}
          </span>
          <span aria-hidden="true" className="mt-0.5 text-[0.62rem] uppercase tracking-[0.1em] text-muted">
            {month}
          </span>
        </time>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9rem] font-medium text-ink">{event.title}</p>
          <p className="mt-1 truncate text-[0.78rem] text-muted">
            {event.client?.name || 'No client'} · {eventTypeLabel(event.eventTypeId, event.customEventType)}
          </p>
        </div>

        <Badge tone={status.tone} className="mt-0.5 hidden shrink-0 sm:inline-flex">
          {status.label}
        </Badge>
        <ArrowRight
          size={15}
          aria-hidden="true"
          className="mt-1 hidden shrink-0 text-line-strong transition-colors group-hover:text-muted sm:block"
        />
      </Link>
    </li>
  );
}

export default function NextEvents({ events }) {
  return (
    <Panel
      id="next-events"
      title="Next events"
      description="Active events starting today or later."
      bodyClassName={events.length ? 'px-3 py-2' : 'p-5'}
      footer={
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-brand transition-colors hover:text-brand-hover"
        >
          All events
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      }
    >
      {events.length ? (
        <ul className="divide-y divide-line">
          {events.map((event) => (
            <EventRow key={event._id} event={event} />
          ))}
        </ul>
      ) : (
        <p className="text-[0.85rem] leading-relaxed text-muted">
          No upcoming events yet. Add an event with a start date and it will appear here.
        </p>
      )}
    </Panel>
  );
}
