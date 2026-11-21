import Skeleton from '../ui/Skeleton.jsx';

// Holds the header, the segmented tabs and the overview grid while the event
// loads, so the page does not jump when the data arrives.
export default function EventDetailSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading event…</span>

      <Skeleton className="h-4 w-24" />

      <div>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-3 h-10 w-2/3 max-w-md" />
        <Skeleton className="mt-2 h-4 w-52 max-w-full" />
      </div>

      <Skeleton className="h-12 w-full rounded-full" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <Skeleton className="h-6 w-32" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-4 w-40 max-w-full" />
                <Skeleton className="mt-1.5 h-3 w-28 max-w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-card border border-line bg-surface p-5 shadow-card">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-3 h-1.5 w-full" />
          </div>
          <div className="rounded-card border border-line bg-surface p-5 shadow-card">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
