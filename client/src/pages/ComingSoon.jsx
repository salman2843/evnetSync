import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import usePageTitle from '../lib/usePageTitle.js';

// Temporary content for a signed-in route whose real screen comes next. It sits
// inside AppShell, so navigation and sign out still work.
export default function ComingSoon({ title, description }) {
  usePageTitle(title);

  return (
    <div className="panel-enter max-w-[46ch]">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted">
        Next in the rebuild
      </p>
      <h1 className="mt-3 font-display text-[2rem] leading-[1.1] tracking-[-0.02em] text-ink">
        {title}
      </h1>
      <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">{description}</p>

      <Link
        to="/dashboard"
        className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-field text-[0.85rem] font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to dashboard
      </Link>
    </div>
  );
}
