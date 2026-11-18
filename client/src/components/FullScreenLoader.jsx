import BrandMark from './BrandMark.jsx';

// Quiet full-screen state used while the stored token is being checked.
export default function FullScreenLoader({ label = 'Loading EventSync' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
        <BrandMark className="h-8 w-8 animate-pulse text-brand" />
        <span className="text-sm text-muted">{label}</span>
      </div>
    </div>
  );
}
