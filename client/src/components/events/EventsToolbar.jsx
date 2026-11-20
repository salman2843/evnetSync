import ChoiceFilter from '../ui/ChoiceFilter.jsx';
import TextField from '../ui/TextField.jsx';
import { formatCount } from '../../lib/format.js';
import { EVENT_STATUS, EVENT_STATUS_ORDER } from '../../lib/labels.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...EVENT_STATUS_ORDER.map((id) => ({ value: id, label: EVENT_STATUS[id].label }))
];

const SCOPE_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All dates' }
];

export default function EventsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  scope,
  onScopeChange,
  count,
  loading
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <TextField
          id="events-search"
          type="search"
          label="Search events"
          placeholder="Event or client name"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full sm:max-w-sm"
          autoComplete="off"
        />

        <p
          className="hidden shrink-0 pb-3 text-[0.8rem] text-muted sm:block"
          aria-live="polite"
        >
          {loading ? 'Loading events…' : formatCount(count, 'event', 'events')}
        </p>
      </div>

      {/* Two selects on a phone, two chip rows on a desktop. */}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <ChoiceFilter
          id="events-status"
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={onStatusChange}
        />
        <ChoiceFilter
          id="events-scope"
          label="Show"
          options={SCOPE_OPTIONS}
          value={scope}
          onChange={onScopeChange}
        />
      </div>
    </div>
  );
}
