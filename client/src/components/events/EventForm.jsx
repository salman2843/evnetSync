import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Select from '../ui/Select.jsx';
import TextField from '../ui/TextField.jsx';
import Textarea from '../ui/Textarea.jsx';
import { listClients } from '../../api/clients.js';
import { createEvent, updateEvent } from '../../api/events.js';
import { getEventTypes } from '../../api/meta.js';
import getErrorMessage from '../../lib/apiError.js';
import { toDateTimeLocal } from '../../lib/events.js';
import { EVENT_STATUS, EVENT_STATUS_ORDER } from '../../lib/labels.js';

const EMPTY_VALUES = {
  clientId: '',
  title: '',
  eventTypeId: '',
  customEventType: '',
  subEventTypeId: '',
  status: 'inquiry',
  startAt: '',
  venueName: '',
  venueAddress: '',
  budgetAmount: '',
  budgetSpent: '',
  notes: '',
  generateTasks: true
};

function initialValues(event) {
  if (!event) return EMPTY_VALUES;
  return {
    clientId: event.clientId?._id || event.clientId || '',
    title: event.title || '',
    eventTypeId: event.eventTypeId || '',
    customEventType: event.customEventType || '',
    subEventTypeId: event.subEventTypeId || '',
    status: event.status || 'inquiry',
    startAt: toDateTimeLocal(event.startAt),
    venueName: event.venue?.name || '',
    venueAddress: event.venue?.address || '',
    budgetAmount: event.budget?.amount ? String(event.budget.amount) : '',
    budgetSpent: event.budget?.spent ? String(event.budget.spent) : '',
    notes: event.notes || '',
    generateTasks: true
  };
}

// The same rules the server applies, checked before the request so the planner
// gets the message beside the field instead of at the top of the sheet.
function validate(values, { editing, originalStart }) {
  const errors = {};

  if (!values.clientId) errors.clientId = 'Choose a client.';
  if (!values.title.trim()) errors.title = 'Enter an event name.';
  else if (values.title.trim().length > 120) errors.title = 'Keep the name to 120 characters.';
  if (!values.eventTypeId) errors.eventTypeId = 'Choose an event type.';
  else if (values.eventTypeId === 'other' && !values.customEventType.trim()) {
    errors.customEventType = 'Type the event type name.';
  } else if (values.customEventType.trim().length > 80) {
    errors.customEventType = 'Keep the type name to 80 characters.';
  }

  if (!values.startAt) errors.startAt = 'Choose the date and time.';
  else if (Number.isNaN(new Date(values.startAt).getTime())) {
    errors.startAt = 'Enter a valid date and time.';
  } else if (
    new Date(values.startAt).getTime() < Date.now() - 60 * 1000 &&
    !(editing && values.startAt === originalStart)
  ) {
    // An event that already happened may keep its date, but nothing can be
    // moved back into the past.
    errors.startAt = 'Choose today or a later date.';
  }

  for (const [field, label] of [
    ['budgetAmount', 'Budget'],
    ['budgetSpent', 'Spent']
  ]) {
    if (values[field] === '') continue;
    const amount = Number(values[field]);
    if (!Number.isFinite(amount) || amount < 0) errors[field] = `${label} must be zero or more.`;
  }

  if (values.venueName.trim().length > 120) errors.venueName = 'Keep the venue name to 120 characters.';
  if (values.venueAddress.trim().length > 300) {
    errors.venueAddress = 'Keep the address to 300 characters.';
  }
  if (values.notes.trim().length > 2000) errors.notes = 'Keep notes to 2000 characters.';

  return errors;
}

const FIELD_ORDER = ['clientId', 'title', 'eventTypeId', 'customEventType', 'startAt'];

// One form for create and edit, inside the shared Drawer. The catalog (clients
// and event types) is loaded once; the footer stays put while the fields scroll.
export default function EventForm({ event, onSaved, onCancel }) {
  const editing = Boolean(event);
  const originalStart = event ? toDateTimeLocal(event.startAt) : '';
  const nowValue = toDateTimeLocal(new Date());
  // An event that already happened keeps its own date selectable, so editing
  // the venue of a past event does not force a date change.
  const minStart = originalStart && originalStart < nowValue ? originalStart : nowValue;
  const [values, setValues] = useState(() => initialValues(event));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [catalogKey, setCatalogKey] = useState(0);
  const [catalog, setCatalog] = useState({
    clients: [],
    groups: [],
    loading: true,
    error: ''
  });

  const clientRef = useRef(null);
  const titleRef = useRef(null);
  const typeRef = useRef(null);
  const customRef = useRef(null);
  const startRef = useRef(null);
  const refs = {
    clientId: clientRef,
    title: titleRef,
    eventTypeId: typeRef,
    customEventType: customRef,
    startAt: startRef
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    Promise.all([listClients({}, controller.signal), getEventTypes(controller.signal)])
      .then(([clientData, meta]) => {
        if (!active) return;
        setCatalog({
          clients: clientData.clients,
          groups: meta.groups,
          loading: false,
          error: ''
        });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setCatalog((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Could not load clients and event types. Try again.')
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [catalogKey]);

  // A sub-type and a custom name belong to one type only, so switching type
  // clears both instead of sending a value the server would reject.
  const allTypes = catalog.groups.flatMap((group) => group.types);
  const selectedType = allTypes.find((type) => type.id === values.eventTypeId);
  const subtypes = selectedType?.subtypes || [];

  function handleChange(input) {
    const { name, value, type, checked } = input.target;
    setValues((current) => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value };
      if (name === 'eventTypeId') {
        next.customEventType = '';
        next.subEventTypeId = '';
      }
      return next;
    });
    setErrors((current) => {
      if (name === 'eventTypeId') return {};
      return current[name] ? { ...current, [name]: undefined } : current;
    });
    if (formError) setFormError('');
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (saving || catalog.loading) return;

    const nextErrors = validate(values, { editing, originalStart });
    setErrors(nextErrors);
    setFormError('');

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    const payload = {
      clientId: values.clientId,
      title: values.title.trim(),
      eventTypeId: values.eventTypeId,
      // Only "Other" carries a custom name, and a sub-type only exists for the
      // types that define one in the catalog.
      customEventType: values.eventTypeId === 'other' ? values.customEventType.trim() : '',
      subEventTypeId: subtypes.some((subtype) => subtype.id === values.subEventTypeId)
        ? values.subEventTypeId
        : '',
      status: values.status,
      startAt: new Date(values.startAt).toISOString(),
      venue: {
        name: values.venueName.trim(),
        address: values.venueAddress.trim()
      },
      budget: {
        amount: Number(values.budgetAmount || 0),
        spent: Number(values.budgetSpent || 0),
        // EventSync bills in rupees only, so the currency picker is gone.
        currency: 'INR'
      },
      notes: values.notes.trim()
    };
    if (!editing) payload.generateTasks = values.generateTasks;

    setSaving(true);
    try {
      const result = editing
        ? { event: await updateEvent(event._id, payload), tasks: [] }
        : await createEvent(payload);
      onSaved(result, editing);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not save this event. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  const hasClients = catalog.clients.length > 0;

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

        {catalog.error ? (
          <div className="mb-5 rounded-field border border-danger/20 bg-danger/[0.05] px-3.5 py-2.5 text-[0.8rem] leading-snug text-danger">
            <p>{catalog.error}</p>
            <button
              type="button"
              onClick={() => {
                setCatalog((current) => ({ ...current, loading: true, error: '' }));
                setCatalogKey((value) => value + 1);
              }}
              className="mt-1.5 font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
            >
              Try again
            </button>
          </div>
        ) : null}

        <fieldset className="min-w-0 space-y-4 border-0 p-0">
          <legend className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted">
            The event
          </legend>

          <Select
            key={catalog.loading ? 'clients-loading' : 'clients-ready'}
            ref={clientRef}
            id="event-client"
            name="clientId"
            label="Client"
            value={values.clientId}
            onChange={handleChange}
            error={errors.clientId}
            hint={
              !catalog.loading && !hasClients
                ? 'You need a client first. Add one from the Clients screen, then come back.'
                : undefined
            }
            disabled={catalog.loading}
          >
            <option value="">{catalog.loading ? 'Loading clients…' : 'Choose a client'}</option>
            {catalog.clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name}
              </option>
            ))}
          </Select>

          <TextField
            ref={titleRef}
            id="event-title"
            name="title"
            label="Event name"
            placeholder="Aarav & Sana wedding"
            autoFocus
            value={values.title}
            onChange={handleChange}
            error={errors.title}
          />

          <Select
            key={catalog.loading ? 'types-loading' : 'types-ready'}
            ref={typeRef}
            id="event-type"
            name="eventTypeId"
            label="Event type"
            value={values.eventTypeId}
            onChange={handleChange}
            error={errors.eventTypeId}
            disabled={catalog.loading}
          >
            <option value="">Choose an event type</option>
            {catalog.groups.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>

          {values.eventTypeId === 'other' ? (
            <TextField
              ref={customRef}
              id="event-custom-type"
              name="customEventType"
              label="Event type name"
              placeholder="Alumni meet, community drive, ..."
              hint="This is what the calendar and event screen will show."
              value={values.customEventType}
              onChange={handleChange}
              error={errors.customEventType}
            />
          ) : null}

          {subtypes.length ? (
            <Select
              id="event-subtype"
              name="subEventTypeId"
              label={selectedType.subtypeLabel || 'Sub-type'}
              value={values.subEventTypeId}
              onChange={handleChange}
            >
              <option value="">
                Choose a {(selectedType.subtypeLabel || 'sub-type').toLowerCase()}
              </option>
              {subtypes.map((subtype) => (
                <option key={subtype.id} value={subtype.id}>
                  {subtype.label}
                </option>
              ))}
            </Select>
          ) : null}

          <TextField
            ref={startRef}
            id="event-start"
            name="startAt"
            type="datetime-local"
            label="Date and time"
            min={minStart}
            hint="Choose today or a later date."
            value={values.startAt}
            onChange={handleChange}
            error={errors.startAt}
          />

          <Select
            id="event-status"
            name="status"
            label="Status"
            value={values.status}
            onChange={handleChange}
          >
            {EVENT_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {EVENT_STATUS[status].label}
              </option>
            ))}
          </Select>
        </fieldset>

        <fieldset className="mt-7 min-w-0 space-y-4 border-0 p-0">
          <legend className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted">
            Venue and budget
          </legend>

          <TextField
            id="event-venue-name"
            name="venueName"
            label="Venue"
            placeholder="The Grand Pavilion"
            hint="Optional. Leave blank for a virtual or client-site event."
            value={values.venueName}
            onChange={handleChange}
            error={errors.venueName}
          />

          <Textarea
            id="event-venue-address"
            name="venueAddress"
            label="Venue address"
            rows={2}
            placeholder="Street, area, city"
            value={values.venueAddress}
            onChange={handleChange}
            error={errors.venueAddress}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="event-budget-amount"
              name="budgetAmount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              label="Budget (₹)"
              placeholder="0"
              value={values.budgetAmount}
              onChange={handleChange}
              error={errors.budgetAmount}
            />
            <TextField
              id="event-budget-spent"
              name="budgetSpent"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              label="Spent (₹)"
              placeholder="0"
              value={values.budgetSpent}
              onChange={handleChange}
              error={errors.budgetSpent}
            />
          </div>
        </fieldset>

        <fieldset className="mt-7 min-w-0 space-y-4 border-0 p-0">
          <legend className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted">
            Planning
          </legend>

          <Textarea
            id="event-notes"
            name="notes"
            label="Notes"
            rows={4}
            placeholder="Decisions, preferences, anything the team should know"
            value={values.notes}
            onChange={handleChange}
            error={errors.notes}
          />

          {!editing ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-field border border-line bg-canvas px-3.5 py-3">
              <input
                id="event-generate-tasks"
                name="generateTasks"
                type="checkbox"
                checked={values.generateTasks}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              <span className="min-w-0">
                <span className="block text-[0.88rem] font-medium text-ink">
                  Add the suggested checklist
                </span>
                <span className="mt-0.5 block text-[0.8rem] leading-snug text-muted">
                  Creates the usual planning steps for this event type. You can edit or delete
                  them later.
                </span>
              </span>
            </label>
          ) : null}
        </fieldset>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={catalog.loading}>
          {editing ? 'Save changes' : 'Create event'}
        </Button>
      </div>
    </form>
  );
}
