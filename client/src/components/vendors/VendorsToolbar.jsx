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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <TextField
          id="vendors-search"
          type="search"
          label="Search vendors"
          placeholder="Name, phone, email or area"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full sm:max-w-xs"
          autoComplete="off"
        />

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

      <p className="text-[0.8rem] text-muted" aria-live="polite">
        {loading ? 'Loading…' : formatCount(total, 'vendor', 'vendors')}
      </p>
    </div>
  );
}
