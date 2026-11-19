import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Right-side sheet on desktop, full screen on a phone. Focus moves into the
// panel, Tab stays inside, Escape and the backdrop close it, and the planner's
// previous focus is restored on the way out.
export default function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  bodyClassName = 'min-h-0 flex-1 overflow-y-auto px-5 py-5',
  children
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  // Parents pass an inline close handler; keeping it in a ref means the effect
  // below runs only when the sheet opens or closes, not on every render.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    panel?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const items = Array.from(panel.querySelectorAll(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  // A portal keeps the sheet above the app's sticky header and tab bar: z-index
  // only competes between siblings, and <main> sits below those bars.
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="fade-enter absolute inset-0 bg-ink/30"
        onClick={() => closeRef.current()}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="sheet-enter absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-surface shadow-card outline-none sm:max-w-[27rem]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-[1.35rem] leading-tight tracking-[-0.01em] text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-[0.8rem] leading-snug text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => closeRef.current()}
            aria-label="Close"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={bodyClassName}>{children}</div>

        {footer ? <div className="border-t border-line px-5 py-3">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
