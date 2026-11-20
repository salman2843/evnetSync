import { Plus, Search, Store } from 'lucide-react';
import Button from '../ui/Button.jsx';

// Two empty states: a brand-new vendor book, and a filter that matched nothing.
export default function VendorsEmpty({ filtered = false, onAdd, onClear }) {
  if (filtered) {
    return (
      <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-wash text-muted">
          <Search size={20} aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-[1.4rem] leading-tight text-ink">
          No vendors match
        </h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-[0.88rem] leading-relaxed text-muted">
          Try a different name or service, or clear the filters to see the whole book.
        </p>
        <Button variant="ghost" className="mt-5" onClick={onClear}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
        <Store size={20} aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-[1.4rem] leading-tight text-ink">
        Start your vendor book
      </h2>
      <p className="mx-auto mt-2 max-w-[38ch] text-[0.88rem] leading-relaxed text-muted">
        Add the caterers, photographers and decorators you work with. Then you can put them
        on an event in one step instead of hunting for a phone number.
      </p>
      <Button className="mt-5" onClick={onAdd}>
        <Plus size={16} aria-hidden="true" />
        Add your first vendor
      </Button>
    </div>
  );
}
