import BrandMark from '../BrandMark.jsx';

// Illustrative planner week for the dark panel. No customer names or figures,
// so nothing here reads as a claim about real data.
const WEEK = [
  { date: '19', title: 'Venue walkthrough', meta: 'Catering · Decor', status: 'Confirmed' },
  { date: '21', title: 'Cake tasting', meta: 'Birthday · Client', status: 'Planning' },
  { date: '24', title: 'AV hold', meta: 'Conference · 2 days', status: 'Inquiry' }
];

// The shared left panel for /login and /register. Decorative only, so it is
// hidden from assistive tech and from the layout below lg.
export default function AuthPanel({
  headline = (
    <>
      The whole event,
      <br />
      on one page.
    </>
  ),
  body = 'Clients, vendors, budgets and the next thing to do — kept together from first enquiry to final invoice.',
  footnote = 'Built for independent event planners.'
}) {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden overflow-hidden bg-ink px-12 py-12 lg:flex lg:flex-col xl:px-16 xl:py-14"
    >
      {/* Warm light on ink, low and soft; the only colour field on the page. */}
      <div className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 -left-28 h-[26rem] w-[26rem] rounded-full bg-accent/10 blur-[110px]" />

      <div className="relative flex items-center gap-3">
        <BrandMark className="h-9 w-9 text-brand-tint" />
        <span className="font-display text-[1.35rem] tracking-[-0.01em] text-canvas">EventSync</span>
      </div>

      <div className="relative mt-auto max-w-[30rem]">
        <p className="font-display text-[2.75rem] leading-[1.06] tracking-[-0.025em] text-canvas xl:text-[3.15rem]">
          {headline}
        </p>
        <p className="mt-6 max-w-[38ch] text-[0.95rem] leading-relaxed text-onInk-soft">{body}</p>

        <div className="mt-12 rounded-card border border-onInk/10 bg-onInk/[0.04] p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.68rem] uppercase tracking-[0.16em] text-onInk-muted">
              This week
            </span>
            <span className="text-[0.68rem] tracking-wide text-onInk-muted">November</span>
          </div>

          <div className="rule-draw mt-4 h-px bg-gradient-to-r from-brand/80 via-brand/30 to-transparent" />

          <ol>
            {WEEK.map((item, index) => (
              <li
                key={item.title}
                className="row-enter flex items-start gap-4 border-b border-onInk/10 py-3.5 last:border-b-0 last:pb-0"
                style={{ animationDelay: `${180 + index * 90}ms` }}
              >
                <span className="w-8 shrink-0 font-display text-xl leading-none text-canvas">
                  {item.date}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[0.85rem] font-medium text-onInk">
                      {item.title}
                    </span>
                    <span className="shrink-0 rounded-full border border-onInk/15 px-2 py-0.5 text-[0.65rem] font-medium text-onInk-soft">
                      {item.status}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[0.75rem] text-onInk-muted">
                    {item.meta}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="relative mt-12 text-[0.72rem] tracking-wide text-onInk-muted">{footnote}</p>
    </aside>
  );
}
