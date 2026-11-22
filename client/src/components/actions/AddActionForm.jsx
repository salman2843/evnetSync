import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Select from '../ui/Select.jsx';
import TextField from '../ui/TextField.jsx';
import Textarea from '../ui/Textarea.jsx';
import { createAction } from '../../api/actions.js';
import { listEvents } from '../../api/events.js';
import getErrorMessage from '../../lib/apiError.js';
import { toDateTimeLocal } from '../../lib/events.js';
import { formatShortDate } from '../../lib/format.js';
import { TASK_PRIORITY, TASK_PRIORITY_ORDER } from '../../lib/labels.js';

const EMPTY_VALUES = {
  title: '',
  eventId: '',
  dueAt: '',
  priority: 'normal',
  description: ''
};

// The next morning, which is when most reminders should start.
function dueIn(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return toDateTimeLocal(date);
}

const QUICK_DUES = [
  { label: 'Today', value: dueIn(0) },
  { label: 'Tomorrow', value: dueIn(1) },
  { label: 'In a week', value: dueIn(7) }
];

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Enter an action name.';
  else if (values.title.trim().length > 200) {
    errors.title = 'Keep the action name to 200 characters.';
  }
  if (values.dueAt && Number.isNaN(new Date(values.dueAt).getTime())) {
    errors.dueAt = 'Enter a valid due date.';
  }
  return errors;
}

// A manual action belongs to an event only when the planner picks one, so the
// event select is optional and loads the planner's whole calendar once.
export default function AddActionForm({ onSaved, onCancel }) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [events, setEvents] = useState([]);
  const [eventsError, setEventsError] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    listEvents({ scope: 'all' }, controller.signal)
      .then((data) => {
        if (active) setEvents(data.events);
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setEventsError('Events could not load. You can still add this action without one.');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  function handleChange(input) {
    const { name, value } = input.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    if (formError) setFormError('');
  }

  function setDue(value) {
    setValues((current) => ({ ...current, dueAt: value }));
    setErrors((current) => ({ ...current, dueAt: undefined }));
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (saving) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (nextErrors.title) {
      titleRef.current?.focus();
      return;
    }
    if (nextErrors.dueAt) return;

    setSaving(true);
    try {
      const action = await createAction({
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
        dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null,
        eventId: values.eventId || null
      });
      onSaved(action);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not add this action. Try again.'));
    } finally {
      setSaving(false);
    }
  }

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

        <div className="space-y-4">
          <TextField
            ref={titleRef}
            id="action-title"
            name="title"
            label="Action"
            placeholder="Call the caterer, send the deposit, ..."
            value={values.title}
            onChange={handleChange}
            error={errors.title}
            autoComplete="off"
          />

          <Select
            id="action-event"
            name="eventId"
            label="Event"
            hint={eventsError || 'Optional. Link this reminder to an event.'}
            value={values.eventId}
            onChange={handleChange}
          >
            <option value="">No event</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title} · {formatShortDate(event.startAt)}
              </option>
            ))}
          </Select>

          <div>
            <TextField
              id="action-due"
              name="dueAt"
              type="datetime-local"
              label="Due"
              hint="Optional. Quick choices set it for 9:00."
              value={values.dueAt}
              onChange={handleChange}
              error={errors.dueAt}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_DUES.map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  onClick={() => setDue(quick.value)}
                  className="h-9 rounded-full border border-line bg-surface px-3 text-[0.75rem] font-medium text-ink-soft transition-colors hover:border-line-strong hover:bg-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  {quick.label}
                </button>
              ))}
              {values.dueAt ? (
                <button
                  type="button"
                  onClick={() => setDue('')}
                  className="h-9 rounded-full px-3 text-[0.75rem] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <Select
            id="action-priority"
            name="priority"
            label="Priority"
            value={values.priority}
            onChange={handleChange}
          >
            {TASK_PRIORITY_ORDER.map((priority) => (
              <option key={priority} value={priority}>
                {TASK_PRIORITY[priority].label}
              </option>
            ))}
          </Select>

          <Textarea
            id="action-description"
            name="description"
            label="Notes"
            hint="Optional."
            rows={3}
            value={values.description}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Add action
        </Button>
      </div>
    </form>
  );
}
