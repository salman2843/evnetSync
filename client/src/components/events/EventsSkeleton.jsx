import Skeleton from '../ui/Skeleton.jsx';

// Keeps the spotlight and the month sheets in place while the first list loads.
export default function EventsSkeleton() {
  return (
    <div role="status" className="space-y-7">
      <span className="sr-only">Loading events…</span>

      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-4 h-12 w-36" />
        <Skeleton className="mt-4 h-6 w-64 max-w-full" />
        <Skeleton className="mt-2 h-4 w-44" />
        <div className="mt-6 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      {[0, 1].map((group) => (
        <div key={group}>
          <Skeleton className="h-5 w-36" />
          <div className="mt-3 rounded-card border border-line bg-surface p-2 shadow-card">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-start gap-4 px-2 py-3.5">
                <Skeleton className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="mt-2 h-3 w-36 max-w-full" />
                  <Skeleton className="mt-2.5 h-3 w-56 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
