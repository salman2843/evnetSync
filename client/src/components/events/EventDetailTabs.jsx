const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'actions', label: 'Actions' }
];

// Segmented control under the event header. It sticks below the mobile top bar
// so switching sections never means scrolling back up. The active tab is in the
// URL (?tab=tasks), which keeps deep links and the back button honest.
export default function EventDetailTabs({ active, onChange }) {
  return (
    <div className="sticky top-[64px] z-10 -mx-5 border-b border-line bg-canvas/95 px-5 py-2 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 lg:-mx-10 lg:px-10">
      <div
        role="tablist"
        aria-label="Event sections"
        className="grid grid-cols-4 rounded-full border border-line bg-surface p-1 shadow-field sm:inline-grid sm:min-w-[22rem]"
      >
        {TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`event-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`event-panel-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={[
                'h-10 rounded-full px-2 text-[0.82rem] font-medium transition-colors duration-150 sm:text-[0.85rem]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                selected
                  ? 'bg-ink text-onInk shadow-card'
                  : 'text-ink-soft hover:bg-wash hover:text-ink'
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
