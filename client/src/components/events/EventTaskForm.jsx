import { useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Select from '../ui/Select.jsx';
import TextField from '../ui/TextField.jsx';
import { createTask, updateTask } from '../../api/events.js';
import getErrorMessage from '../../lib/apiError.js';
import { toDateTimeLocal } from '../../lib/events.js';
import { TASK_PRIORITY_ORDER, TASK_PRIORITY } from '../../lib/labels.js';

function initialValues(task) {
  return {
    title: task?.title || '',
    dueAt: task?.dueAt ? toDateTimeLocal(task.dueAt) : '',
    priority: task?.priority || 'normal'
  };
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Enter a task name.';
  else if (values.title.trim().length > 160) errors.title = 'Keep the task name to 160 characters.';
  if (values.dueAt && Number.isNaN(new Date(values.dueAt).getTime())) {
    errors.dueAt = 'Enter a valid due date.';
  }
  return errors;
}

// Add or edit one checklist step. Due dates are optional; a task without one
// sits at the bottom of the list rather than pretending to have a deadline.
export default function EventTaskForm({ eventId, task, onSaved, onCancel }) {
  const editing = Boolean(task);
  const [values, setValues] = useState(() => initialValues(task));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  function handleChange(input) {
    const { name, value } = input.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    if (formError) setFormError('');
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (saving) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError('');
    if (nextErrors.title) {
      titleRef.current?.focus();
      return;
    }
    if (nextErrors.dueAt) return;

    const payload = {
      title: values.title.trim(),
      dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null,
      priority: values.priority
    };

    setSaving(true);
    try {
      const saved = editing
        ? await updateTask(eventId, task._id, payload)
        : await createTask(eventId, payload);
      onSaved(saved, editing);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not save this task. Try again.'));
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
            id="task-title"
            name="title"
            label="Task"
            placeholder="Confirm the caterer, send the invites, ..."
            value={values.title}
            onChange={handleChange}
            error={errors.title}
          />

          <TextField
            id="task-due"
            name="dueAt"
            type="datetime-local"
            label="Due"
            hint="Optional."
            value={values.dueAt}
            onChange={handleChange}
            error={errors.dueAt}
          />

          <Select
            id="task-priority"
            name="priority"
            label="Priority"
            value={values.priority}
            onChange={handleChange}
            error={errors.priority}
          >
            {TASK_PRIORITY_ORDER.map((priority) => (
              <option key={priority} value={priority}>
                {TASK_PRIORITY[priority].label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {editing ? 'Save task' : 'Add task'}
        </Button>
      </div>
    </form>
  );
}
