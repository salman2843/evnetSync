import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import Button from './Button.jsx';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A styled replacement for window.confirm. The least destructive action gets
// focus, Escape cancels, and a server refusal (for example a client that still
// has events) stays inside the dialog where the planner can read it.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
  error = '',
  onConfirm,
  onCancel,
  children
}) {
  const panelRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const cancelRefHandler = useRef(onCancel);
  cancelRefHandler.current = onCancel;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !loading) {
        event.stopPropagation();
        cancelRefHandler.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
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
  }, [open, loading]);

  if (!open) return null;

  // Same reason as the Drawer: the dialog must sit above the sticky header and
  // tab bar, which a z-index inside <main> cannot beat.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-4 sm:items-center sm:pb-0">
      <div
        className="fade-enter absolute inset-0 bg-ink/30"
        onClick={() => {
          if (!loading) onCancel();
        }}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="sheet-enter relative w-full max-w-[26rem] rounded-card border border-line bg-surface p-5 shadow-card"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/[0.08] text-danger">
            <AlertCircle size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-[1.25rem] leading-tight tracking-[-0.01em] text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-[0.85rem] leading-relaxed text-muted">
                {description}
              </p>
            ) : null}
            {children}
            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-field border border-danger/20 bg-danger/[0.05] px-3 py-2 text-[0.8rem] leading-snug text-danger"
              >
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button ref={cancelRef} variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            loading={loading}
            className="bg-danger hover:bg-danger/90 focus-visible:ring-danger"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
