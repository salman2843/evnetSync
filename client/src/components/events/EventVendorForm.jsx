import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Select from '../ui/Select.jsx';
import TextField from '../ui/TextField.jsx';
import Textarea from '../ui/Textarea.jsx';
import { assignVendor, updateEventVendor } from '../../api/events.js';
import { listVendors } from '../../api/vendors.js';
import getErrorMessage from '../../lib/apiError.js';
import { ASSIGNMENT_STATUS, ASSIGNMENT_STATUS_ORDER } from '../../lib/labels.js';

function initialValues(assignment) {
  return {
    vendorId: assignment?.vendorId?._id || '',
    serviceCategoryId: assignment?.serviceCategoryId || '',
    status: assignment?.status || 'considering',
    agreedAmount: assignment?.agreedAmount ? String(assignment.agreedAmount) : '',
    notes: assignment?.notes || ''
  };
}

// Add a vendor to an event, or change the deal later. The vendor itself is
// fixed once assigned; removing and re-adding is the way to correct a mistake.
export default function EventVendorForm({
  eventId,
  assignment,
  categories = [],
  assignedVendorIds = [],
  onSaved,
  onCancel
}) {
  const editing = Boolean(assignment);
  const [values, setValues] = useState(() => initialValues(assignment));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [vendorState, setVendorState] = useState({
    vendors: [],
    loading: !assignment,
    error: ''
  });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (editing) return undefined;
    const controller = new AbortController();
    let active = true;

    setVendorState((current) => ({ ...current, loading: true, error: '' }));

    listVendors({}, controller.signal)
      .then((data) => {
        if (!active) return;
        setVendorState({ vendors: data.vendors, loading: false, error: '' });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setVendorState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Could not load your vendors. Try again.')
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [editing, retryKey]);

  // A vendor already on this event cannot be added twice, so leave it out of
  // the picker instead of letting the server refuse the save.
  const choices = vendorState.vendors.filter(
    (vendor) => !assignedVendorIds.includes(vendor._id)
  );

  function handleChange(input) {
    const { name, value } = input.target;
    setValues((current) => {
      const next = { ...current, [name]: value };
      // Picking a vendor fills its first service category when one is still blank.
      if (name === 'vendorId' && !current.serviceCategoryId) {
        const vendor = choices.find((item) => item._id === value);
        next.serviceCategoryId = vendor?.serviceCategoryIds?.[0] || '';
      }
      return next;
    });
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    if (formError) setFormError('');
  }

  function validate() {
    const next = {};
    if (!editing && !values.vendorId) next.vendorId = 'Choose a vendor.';
    if (values.agreedAmount !== '' && Number(values.agreedAmount) < 0) {
      next.agreedAmount = 'Enter zero or more.';
    }
    if (values.notes.length > 2000) next.notes = 'Keep notes to 2000 characters.';
    return next;
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (saving) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    const payload = {
      serviceCategoryId: values.serviceCategoryId,
      status: values.status,
      agreedAmount: Number(values.agreedAmount || 0),
      // EventSync works in rupees only, so assignments do too.
      currency: 'INR',
      notes: values.notes.trim()
    };
    if (!editing) payload.vendorId = values.vendorId;

    setSaving(true);
    try {
      const saved = editing
        ? await updateEventVendor(eventId, assignment._id, payload)
        : await assignVendor(eventId, payload);
      onSaved(saved, editing);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not save this vendor. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  const noVendorsLeft = !editing && !vendorState.loading && choices.length === 0;
  const bookEmpty = !editing && !vendorState.loading && vendorState.vendors.length === 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {formError ? (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-field border border-danger/25 bg-danger/[0.06] px-3.5 py-3 text-[0.85rem] leading-snug text-danger"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{formError}</p>
          </div>
        ) : null}

        {!editing && vendorState.error ? (
          <div className="mb-5 rounded-field border border-danger/20 bg-danger/[0.05] px-3.5 py-2.5 text-[0.8rem] leading-snug text-danger">
            <p>{vendorState.error}</p>
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="mt-1.5 font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
            >
              Try again
            </button>
          </div>
        ) : null}

        <div className="space-y-4">
          {editing ? (
            <p className="rounded-field border border-line bg-canvas px-3.5 py-3 text-[0.88rem] text-ink">
              {assignment.vendorId?.name || 'This vendor'}
            </p>
          ) : (
            <Select
              id="assignment-vendor"
              name="vendorId"
              label="Vendor"
              value={values.vendorId}
              onChange={handleChange}
              error={errors.vendorId}
              disabled={vendorState.loading || noVendorsLeft}
              hint={
                bookEmpty
                  ? 'Your vendor book is empty. Add a vendor from the Vendors screen first.'
                  : noVendorsLeft
                    ? 'Every vendor in your book is already on this event. Add another vendor there first.'
                    : undefined
              }
            >
              <option value="">
                {vendorState.loading ? 'Loading vendors…' : 'Choose a vendor'}
              </option>
              {choices.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
          )}

          <Select
            id="assignment-category"
            name="serviceCategoryId"
            label="Service"
            value={values.serviceCategoryId}
            onChange={handleChange}
            error={errors.serviceCategoryId}
          >
            <option value="">Not specified</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="assignment-status"
              name="status"
              label="Status"
              value={values.status}
              onChange={handleChange}
              error={errors.status}
            >
              {ASSIGNMENT_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {ASSIGNMENT_STATUS[status].label}
                </option>
              ))}
            </Select>

            <TextField
              id="assignment-amount"
              name="agreedAmount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              label="Agreed (₹)"
              placeholder="0"
              value={values.agreedAmount}
              onChange={handleChange}
              error={errors.agreedAmount}
            />
          </div>

          <Textarea
            id="assignment-notes"
            name="notes"
            label="Notes"
            rows={3}
            placeholder="Quote, contact person, what to confirm next"
            value={values.notes}
            onChange={handleChange}
            error={errors.notes}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={saving}
          disabled={!editing && (vendorState.loading || noVendorsLeft)}
        >
          {editing ? 'Save vendor' : 'Assign vendor'}
        </Button>
      </div>
    </form>
  );
}
