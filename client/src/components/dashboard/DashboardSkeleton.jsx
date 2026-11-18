import Skeleton from '../ui/Skeleton.jsx';

// Matches the real dashboard's shape so content does not jump when it lands.
export default function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-card border border-line bg-surface p-5 shadow-card">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-14" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-card border border-line bg-surface p-5 shadow-card">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-48" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((__, row) => (
                <div key={row} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
