import Select from '../ui/Select.jsx';
import TextField from '../ui/TextField.jsx';
import { formatCount } from '../../lib/format.js';

export default function VendorsToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  total,
  loading
}) {
  return (
    <div className="space-y-4">
      {/* Search and service share one row from sm up. On a phone the service
          picker keeps its half-width cell under the search field. */}
      <div className="sm:flex sm:items-end sm:gap-3">
        <TextField
          id="vendors-search"
          type="search"
          label="Search vendors"
          placeholder="Name, phone, email or area"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full sm:w-80"
          autoComplete="off"
        />

        <div className="mt-4 grid grid-cols-2 items-end gap-3 sm:mt-0 sm:block">
          <Select
            id="vendors-category"
            label="Service"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full sm:w-56"
          >
            <option value="">All services</option>
            {categories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <p
          className="hidden shrink-0 pb-3 text-[0.85rem] text-muted sm:ml-auto sm:block"
          aria-live="polite"
        >
          {loading ? 'Loading…' : formatCount(total, 'vendor', 'vendors')}
        </p>
      </div>
    </div>
  );
}
