// Loading placeholder. The parent decides the shape; this only draws the block.
export default function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-field bg-line/70 ${className}`}
    />
  );
}
