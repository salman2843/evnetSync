import FilterChips from '../ui/FilterChips.jsx';
import Select from '../ui/Select.jsx';
import TextField from '../ui/TextField.jsx';
import { formatCount } from '../../lib/format.js';
import { CLIENT_STATUS_ORDER } from '../../lib/labels.js';

export default function ClientsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  total,
  loading
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <TextField
          id="clients-search"
          type="search"
          label="Search clients"
          placeholder="Name, company, phone or email"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full sm:max-w-xs"
          autoComplete="off"
        />

        <Select
          id="clients-sort"
          label="Sort by"
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="w-full sm:w-44"
        >
          <option value="recent">Newest first</option>
          <option value="name">Name A–Z</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Filter by status"
          options={['All', ...CLIENT_STATUS_ORDER]}
          value={status}
          onChange={onStatusChange}
        />
        <p className="text-[0.8rem] text-muted" aria-live="polite">
          {loading ? 'Loading…' : formatCount(total, 'person', 'people')}
        </p>
      </div>
    </div>
  );
}
