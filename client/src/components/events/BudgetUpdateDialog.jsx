import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';
import { updateEvent } from '../../api/events.js';
import getErrorMessage from '../../lib/apiError.js';
import { formatMoney } from '../../lib/format.js';

const QUICK_AMOUNTS = [5000, 10000, 25000];
const MAX_AMOUNT = 100000000;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A small "add money" dialog for the overview. Spend is the default because
// that is the everyday action; raising the total budget is one switch away.
// Over-budget is allowed but never silent: the warning shows before saving and
// the page repeats it in the toast afterwards.
export default function BudgetUpdateDialog({ open, event, onClose, onSaved }) {
  const [mode, setMode] = useState('spend');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // The keydown listener is installed once per open; a ref keeps it aware of a
  // request that is already in flight without re-running the reset.
  const savingRef = useRef(saving);
  savingRef.current = saving;

  useEffect(() => {
    if (!open) return undefined;

    setMode('spend');
    setAmount('');
    setError('');
    setSaving(false);

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();

    function handleKeyDown(keyEvent) {
      if (keyEvent.key === 'Escape' && !savingRef.current) {
        keyEvent.stopPropagation();
        closeRef.current();
        return;
      }
      if (keyEvent.key !== 'Tab' || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (keyEvent.shiftKey && document.activeElement === first) {
        keyEvent.preventDefault();
        last.focus();
      } else if (!keyEvent.shiftKey && document.activeElement === last) {
        keyEvent.preventDefault();
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

  if (!open || !event) return null;

  const amountNow = Number(event.budget?.amount || 0);
  const spentNow = Number(event.budget?.spent || 0);
  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0;

  const nextAmount = mode === 'budget' ? amountNow + (valid ? value : 0) : amountNow;
  const nextSpent = mode === 'spend' ? spentNow + (valid ? value : 0) : spentNow;
  const over = Math.max(nextSpent - nextAmount, 0);
  const left = Math.max(nextAmount - nextSpent, 0);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (saving) return;

    if (!valid) {
      setError('Enter an amount greater than zero.');
      inputRef.current?.focus();
      return;
    }
    if (value > MAX_AMOUNT) {
      setError(`Keep the amount under ${formatMoney(MAX_AMOUNT)}.`);
      inputRef.current?.focus();
      return;
    }

    setSaving(true);
    setError('');
    try {
      const updated = await updateEvent(event._id, {
        budget: { amount: nextAmount, spent: nextSpent, currency: 'INR' }
      });
      onSaved(updated);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not update the budget. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-4 sm:items-center sm:pb-0">
      <div
        className="fade-enter absolute inset-0 bg-ink/30"
        onClick={() => {
          if (!saving) closeRef.current();
        }}
        aria-hidden="true"
      />

      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onSubmit={handleSubmit}
        noValidate
        className="sheet-enter relative w-full max-w-[26rem] rounded-card border border-line bg-surface p-5 shadow-card"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/[0.08] text-brand">
            <TrendingUp size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-[1.25rem] leading-tight tracking-[-0.01em] text-ink"
            >
              Update budget
            </h2>
            <p id={descriptionId} className="mt-1 text-[0.82rem] leading-relaxed text-muted">
              {formatMoney(amountNow)} planned · {formatMoney(spentNow)} spent
            </p>
          </div>
        </div>

        <div
          role="group"
          aria-label="What to update"
          className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-line bg-canvas p-1"
        >
          {[
            { id: 'spend', label: 'Log spend' },
            { id: 'budget', label: 'Raise budget' }
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={mode === option.id}
              onClick={() => {
                setMode(option.id);
                setError('');
              }}
              className={[
                'h-9 rounded-full text-[0.82rem] font-medium transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                mode === option.id
                  ? 'bg-ink text-onInk shadow-field'
                  : 'text-ink-soft hover:bg-wash hover:text-ink'
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((quick) => {
            const selected = amount === String(quick);
            return (
              <button
                key={quick}
                type="button"
                onClick={() => {
                  setAmount(String(quick));
                  setError('');
                }}
                className={[
                  'h-9 rounded-full border px-3.5 text-[0.82rem] font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                  selected
                    ? 'border-brand/40 bg-brand/[0.08] text-brand'
                    : 'border-line text-ink-soft hover:border-line-strong hover:bg-wash'
                ].join(' ')}
              >
                +{formatMoney(quick)}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <TextField
            ref={inputRef}
            id="budget-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            label="Amount (₹)"
            placeholder="0"
            value={amount}
            onChange={(input) => {
              setAmount(input.target.value);
              if (error) setError('');
            }}
            error={error}
          />
        </div>

        <p className="mt-3 text-[0.82rem] leading-relaxed text-ink-soft">
          {mode === 'spend' ? 'Spent becomes ' : 'Budget becomes '}
          <span className="font-medium text-ink">
            {formatMoney(mode === 'spend' ? nextSpent : nextAmount)}
          </span>
          {' · '}
          {formatMoney(left)} left
        </p>

        {over > 0 ? (
          <p
            role="alert"
            className="mt-2 flex items-start gap-2 rounded-field border border-warning/30 bg-warning/[0.07] px-3 py-2 text-[0.8rem] leading-snug text-warning"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              This puts the event {formatMoney(over)} over budget. You can still save it.
            </span>
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === 'spend' ? 'Add spend' : 'Raise budget'}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
