import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Store, Users } from 'lucide-react';
import Panel from '../ui/Panel.jsx';

const STEPS = [
  {
    to: '/clients',
    icon: Users,
    title: 'Add your first client',
    body: 'A name and a phone number is enough to start.'
  },
  {
    to: '/vendors',
    icon: Store,
    title: 'Keep your vendors close',
    body: 'Caterers, decorators and venues you already trust.'
  },
  {
    to: '/events',
    icon: CalendarDays,
    title: 'Create an event',
    body: 'Every event needs a start date. The rest can follow.'
  }
];

// First run: an empty dashboard should say what to do next, not show zeros.
export default function EmptyWorkspace() {
  return (
    <Panel
      title="Your workspace is empty"
      description="Three small steps and the dashboard starts filling itself in."
    >
      <ol className="divide-y divide-line">
        {STEPS.map(({ to, icon: Icon, title, body }) => (
          <li key={title}>
            <Link
              to={to}
              className="group flex items-center gap-4 rounded-field px-2 py-3.5 transition-colors duration-150 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-field border border-line bg-canvas text-brand">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.88rem] font-medium text-ink">{title}</span>
                <span className="mt-0.5 block text-[0.78rem] text-muted">{body}</span>
              </span>
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="shrink-0 text-line-strong transition-colors group-hover:text-muted"
              />
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
