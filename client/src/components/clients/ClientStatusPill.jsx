import { ChevronDown, Loader2 } from 'lucide-react';
import { CLIENT_STATUS_ORDER, clientStatus } from '../../lib/labels.js';

const TONES = {
  neutral: 'border-line bg-canvas text-ink-soft',
  brand: 'border-brand/20 bg-brand-soft text-brand',
  success: 'border-success/25 bg-success/[0.07] text-success'
};

// The badge is the editor: tapping it opens the native picker and saves the new
// stage straight away. No pencil, no separate edit screen.
export default function ClientStatusPill({ client, saving = false, onChange }) {
  const tone = TONES[clientStatus(client.status).tone] || TONES.neutral;

  return (
    <span className={`relative inline-flex items-center rounded-full border ${tone}`}>
      <select
        value={client.status}
        onChange={(event) => onChange(client, event.target.value)}
        disabled={saving}
        aria-label={`Status for ${client.name}`}
        className="h-11 cursor-pointer appearance-none rounded-full bg-transparent pl-3 pr-8 text-[0.72rem] font-medium tracking-[0.01em] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-wait sm:h-8 sm:text-[0.7rem]"
      >
        {CLIENT_STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      {saving ? (
        <Loader2
          size={13}
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 animate-spin"
        />
      ) : (
        <ChevronDown
          size={13}
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5"
        />
      )}
    </span>
  );
}
