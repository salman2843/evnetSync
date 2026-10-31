import { eventTypeGroups } from '../data/eventTypeCatalog.js';

export default function EventTypePicker({ value, onChange }) {
  function toggleType(typeId) {
    onChange(value.includes(typeId) ? value.filter((id) => id !== typeId) : [...value, typeId]);
  }

  return <div className="space-y-5">
    {eventTypeGroups.map((group) => <section key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4"><h3 className="font-semibold text-slate-900">{group.label}</h3><p className="mt-1 text-sm text-slate-500">{group.description}</p></div>
      <div className="flex flex-wrap gap-2">
        {group.types.map((type) => {
          const selected = value.includes(type.id);
          return <button key={type.id} type="button" aria-pressed={selected} onClick={() => toggleType(type.id)} className={`rounded-full border px-4 py-2 text-sm font-medium transition duration-200 hover:-translate-y-0.5 motion-reduce:transform-none ${selected ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-600' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}>
            <span aria-hidden="true" className="mr-2">{selected ? '✓' : '+'}</span>{type.label}
          </button>;
        })}
      </div>
    </section>)}
  </div>;
}
