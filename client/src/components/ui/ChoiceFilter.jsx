import FilterChips from './FilterChips.jsx';
import Select from './Select.jsx';

// Pills on a wide screen, a native select on a phone. The planner gets the same
// choice either way, but mobile spends one compact row instead of two chip rows.
// Only one branch is displayed, so only one is in the tab order.
export default function ChoiceFilter({ id, label, options, value, onChange, className = '' }) {
  const normalized = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option
  );
  const current = normalized.find((option) => option.value === value) || normalized[0];

  return (
    <div className={className}>
      <Select
        id={id}
        label={label}
        value={current?.value ?? ''}
        onChange={(event) => {
          const next = normalized.find((option) => option.value === event.target.value);
          if (next) onChange(next.value);
        }}
        className="sm:hidden"
      >
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-muted">
          {label}
        </span>
        <FilterChips
          label={label}
          options={normalized.map((option) => option.label)}
          value={current?.label}
          onChange={(nextLabel) => {
            const next = normalized.find((option) => option.label === nextLabel);
            if (next) onChange(next.value);
          }}
        />
      </div>
    </div>
  );
}
