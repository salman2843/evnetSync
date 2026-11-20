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
      <TextField
        id="vendors-search"
        type="search"
        label="Search vendors"
        placeholder="Name, phone, email or area"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="w-full sm:max-w-sm"
        autoComplete="off"
      />

      {/* One compact service picker on every size; the count waits for desktop. */}
      <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
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

        <p
          className="hidden shrink-0 pb-3 text-[0.85rem] text-muted sm:block"
          aria-live="polite"
        >
          {loading ? 'Loading…' : formatCount(total, 'vendor', 'vendors')}
        </p>
      </div>
    </div>
  );
}
