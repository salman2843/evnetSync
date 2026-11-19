import Skeleton from '../ui/Skeleton.jsx';

// Placeholder cards, so the grid keeps its shape while the first page loads.
export default function ClientsSkeleton({ count = 6 }) {
  return (
    <div role="status">
      <span className="sr-only">Loading clients…</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="rounded-card border border-line bg-surface p-5 shadow-card">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="mt-4 h-6 w-40" />
            <Skeleton className="mt-2 h-3.5 w-28" />
            <Skeleton className="mt-5 h-3.5 w-44" />
            <Skeleton className="mt-2 h-3.5 w-36" />
            <Skeleton className="mt-5 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
            <div className="mt-6 flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
