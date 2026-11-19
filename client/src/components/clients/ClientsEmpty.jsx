import { Plus, Search, Users } from 'lucide-react';
import Button from '../ui/Button.jsx';

// Two empty states: an empty client book (invite an action) and a filter that
// matched nothing (offer a way back).
export default function ClientsEmpty({ filtered = false, onAdd, onClear }) {
  if (filtered) {
    return (
      <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-wash text-muted">
          <Search size={20} aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-[1.4rem] leading-tight text-ink">
          No clients match
        </h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-[0.88rem] leading-relaxed text-muted">
          Try a different name or status, or clear the filters to see everyone.
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
        <Users size={20} aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-[1.4rem] leading-tight text-ink">
        Start your client book
      </h2>
      <p className="mx-auto mt-2 max-w-[38ch] text-[0.88rem] leading-relaxed text-muted">
        Add the first person you are planning for. Their contact details and events stay
        together, and a WhatsApp message is always one tap away.
      </p>
      <Button className="mt-5" onClick={onAdd}>
        <Plus size={16} aria-hidden="true" />
        Add your first client
      </Button>
    </div>
  );
}
