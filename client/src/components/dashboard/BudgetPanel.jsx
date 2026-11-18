import Panel from '../ui/Panel.jsx';
import { formatMoney } from '../../lib/format.js';

function BudgetRow({ budget }) {
  const planned = Number(budget.planned) || 0;
  const spent = Number(budget.spent) || 0;
  const over = spent > planned;
  const percent = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0;

  return (
    <div className="py-4 first:pt-1 last:pb-1">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.8rem] font-semibold tracking-wide text-ink">{budget.currency}</span>
          <span className="text-[0.75rem] text-muted">
            {budget.events} {budget.events === 1 ? 'event' : 'events'}
          </span>
        </div>
        <p className="text-[0.8rem] text-ink-soft">
          <span className="font-medium text-ink">{formatMoney(spent, budget.currency)}</span>
          <span className="text-muted"> spent of {formatMoney(planned, budget.currency)}</span>
        </p>
      </div>

      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={`${percent}% of the ${budget.currency} budget spent`}
      >
        <div
          className={`h-full rounded-full ${over ? 'bg-danger' : 'bg-brand'}`}
          style={{ width: `${Math.max(percent, planned > 0 ? 2 : 0)}%` }}
        />
      </div>

      <p className={`mt-1.5 text-[0.75rem] ${over ? 'text-danger' : 'text-muted'}`}>
        {over
          ? `${formatMoney(spent - planned, budget.currency)} over budget`
          : `${formatMoney(planned - spent, budget.currency)} left`}
      </p>
    </div>
  );
}

export default function BudgetPanel({ budgets }) {
  return (
    <Panel
      id="budget"
      title="Budget"
      description="Planned and spent across active events."
      bodyClassName="px-5 pb-2 pt-1"
    >
      {budgets.length ? (
        <div className="divide-y divide-line">
          {budgets.map((budget) => (
            <BudgetRow key={budget.currency} budget={budget} />
          ))}
        </div>
      ) : (
        <p className="py-4 text-[0.85rem] leading-relaxed text-muted">
          No budgets yet. Add an amount to an event and the totals show up here.
        </p>
      )}
    </Panel>
  );
}
