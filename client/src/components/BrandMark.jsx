// Two offset planner pages: events overlapping and staying in sync.
export default function BrandMark({ className = '' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="6.5" width="17" height="19" rx="4" />
      <rect x="11.5" y="3.5" width="17" height="19" rx="4" opacity="0.55" />
      <path d="M8.5 12.5h7M8.5 16h4.5" />
    </svg>
  );
}
