import { assetUrl } from '../lib/assets.js';
import { initialsOf } from '../lib/format.js';

// The planner's business mark: uploaded logo, else a monogram from the business
// name, else their personal initials. There is no "no logo" state to read.
export default function BusinessMark({
  user,
  className = 'h-9 w-9',
  textClassName = 'text-[0.75rem]'
}) {
  const businessName = String(user?.businessName || '').trim();
  const name = businessName || String(user?.name || '').trim();
  const logoUrl = user?.businessLogo?.url;

  if (logoUrl) {
    return (
      <img
        src={assetUrl(logoUrl)}
        alt={businessName ? `${businessName} logo` : 'Business logo'}
        className={`shrink-0 rounded-full border border-line bg-surface object-contain p-0.5 ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand ${textClassName} ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
