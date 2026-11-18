import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Panel from '../ui/Panel.jsx';
import { eventStatus } from '../../lib/labels.js';

const ORDER = ['inquiry', 'planning', 'confirmed', 'completed', 'cancelled'];
const CLOSED = ['completed', 'cancelled'];

// Counts by status, read as a small bar chart. Bars compare within the panel,
// not against a target.
export default function PipelinePanel({ byStatus }) {
  const counts = ORDER.map((status) => ({ status, count: byStatus?.[status] || 0 }));
  const max = Math.max(...counts.map((row) => row.count), 1);

  return (
    <Panel
      id="pipeline"
      title="Pipeline"
      description="Every event you own, by status."
      footer={
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-brand transition-colors hover:text-brand-hover"
        >
          Open events
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      }
    >
      <ul className="space-y-3">
        {counts.map(({ status, count }) => {
          const { label } = eventStatus(status);
          const closed = CLOSED.includes(status);

          return (
            <li key={status} className="grid grid-cols-[5.5rem_minmax(0,1fr)_1.5rem] items-center gap-3">
              <span className={`text-[0.8rem] ${count ? 'text-ink-soft' : 'text-muted'}`}>
                {label}
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-line/70">
                <span
                  className={`block h-full rounded-full ${closed ? 'bg-line-strong' : 'bg-brand/70'}`}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </span>
              <span className="text-right font-display text-[0.95rem] text-ink">{count}</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
