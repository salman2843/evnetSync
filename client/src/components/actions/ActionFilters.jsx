import Select from '../ui/Select.jsx';
import { ACTION_FILTERS } from '../../lib/actionFilters.js';

// Pills on a wide screen, one native select on a phone. The counts ride along in
// the option labels so mobile gets the same information without two chip rows.
export default function ActionFilters({ value, onChange, counts }) {
  const current = ACTION_FILTERS.find((filter) => filter.id === value) || ACTION_FILTERS[0];

  return (
    <div className="w-full sm:w-auto">
      <Select
        id="action-filter"
        label="Show"
        value={current.id}
        onChange={(event) => onChange(event.target.value)}
        className="sm:hidden"
      >
        {ACTION_FILTERS.map((filter) => (
          <option key={filter.id} value={filter.id}>
            {filter.label} ({counts[filter.id] || 0})
          </option>
        ))}
      </Select>

      <div
        role="group"
        aria-label="Filter actions"
        className="hidden flex-wrap gap-1.5 sm:flex"
      >
        {ACTION_FILTERS.map((filter) => {
          const active = filter.id === value;
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(filter.id)}
              className={[
                'inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[0.8rem] font-medium',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                active
                  ? 'border-brand/25 bg-brand-soft text-brand'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-wash'
              ].join(' ')}
            >
              {filter.label}
              <span
                className={`rounded-full px-1.5 text-[0.7rem] leading-5 ${
                  active ? 'bg-brand/10 text-brand' : 'bg-canvas text-muted'
                }`}
              >
                {counts[filter.id] || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
