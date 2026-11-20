import ChoiceFilter from '../ui/ChoiceFilter.jsx';
import Select from '../ui/Select.jsx';
import TextField from '../ui/TextField.jsx';
import { formatCount } from '../../lib/format.js';
import { CLIENT_STATUS_ORDER } from '../../lib/labels.js';

const STATUS_OPTIONS = ['All', ...CLIENT_STATUS_ORDER];

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
      <TextField
        id="clients-search"
        type="search"
        label="Search clients"
        placeholder="Name, company, phone or email"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="w-full sm:max-w-sm"
        autoComplete="off"
      />

      {/* Two short selects on a phone, status pills plus a sort picker on desktop. */}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <ChoiceFilter
          id="clients-status"
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={onStatusChange}
        />

        <div className="flex items-end gap-3">
          <Select
            id="clients-sort"
            label="Sort by"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="min-w-0 flex-1 sm:w-44"
          >
            <option value="recent">Newest first</option>
            <option value="name">Name A–Z</option>
          </Select>

          <p
            className="hidden shrink-0 pb-3 text-[0.85rem] text-muted sm:block"
            aria-live="polite"
          >
            {loading ? 'Loading…' : formatCount(total, 'person', 'people')}
          </p>
        </div>
      </div>
    </div>
  );
}
