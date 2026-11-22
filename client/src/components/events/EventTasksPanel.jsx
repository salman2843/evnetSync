import { useState } from 'react';
import {
  CalendarClock,
  Check,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2
} from 'lucide-react';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import Drawer from '../ui/Drawer.jsx';
import EventTaskForm from './EventTaskForm.jsx';
import { addSuggestedTasks, deleteTask, updateTask } from '../../api/events.js';
import getErrorMessage from '../../lib/apiError.js';
import { describeDue, formatEventDateTime } from '../../lib/format.js';
import { TASK_PRIORITY } from '../../lib/labels.js';

function TaskRow({ task, busy, onToggle, onEdit, onDelete }) {
  const done = task.status === 'completed';
  const due = describeDue(task.dueAt);
  const priority = TASK_PRIORITY[task.priority] || TASK_PRIORITY.normal;

  return (
    <li className="flex items-start gap-2.5 px-4 py-3 sm:px-5">
      <button
        type="button"
        onClick={() => onToggle(task)}
        disabled={busy}
        aria-label={done ? `Reopen "${task.title}"` : `Mark "${task.title}" as done`}
        aria-pressed={done}
        className="grid h-11 w-11 shrink-0 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
      >
        <span
          className={`grid h-6 w-6 place-items-center rounded-full border transition-colors duration-150 ${
            done
              ? 'border-brand bg-brand text-white'
              : 'border-line-strong bg-surface text-transparent hover:border-brand hover:text-brand'
          }`}
        >
          {busy ? (
            <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          ) : (
            <Check size={13} strokeWidth={2.5} aria-hidden="true" />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1 pt-1">
        <p
          className={`text-[0.9rem] leading-snug ${
            done ? 'text-muted line-through' : 'text-ink'
          }`}
        >
          {task.title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${priority.dot}`}
              aria-hidden="true"
            />
            {priority.label} priority
          </span>
          {task.dueAt ? (
            <span className="inline-flex items-center gap-1" title={formatEventDateTime(task.dueAt)}>
              <CalendarClock size={12} aria-hidden="true" />
              {due.text}
            </span>
          ) : (
            <span>No due date</span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit "${task.title}"`}
          className="grid h-11 w-11 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:h-9 sm:w-9"
        >
          <Pencil size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`Delete "${task.title}"`}
          className="grid h-11 w-11 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-danger/[0.06] hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 sm:h-9 sm:w-9"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

// The event checklist. Open steps come first, finished ones stay visible but
// fade back, and every change is saved immediately (there is no separate save).
export default function EventTasksPanel({ event, tasks, onChanged, notify }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  const total = tasks.length;
  const doneCount = tasks.filter((task) => task.status === 'completed').length;
  const openCount = total - doneCount;
  const overdueCount = tasks.filter(
    (task) => task.status === 'open' && task.dueAt && new Date(task.dueAt) < new Date()
  ).length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  // Keep the server's due-date order inside each group, so the next deadline is
  // always the first open row.
  const ordered = [...tasks].sort(
    (a, b) =>
      Number(a.status === 'completed') - Number(b.status === 'completed')
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(task) {
    setEditing(task);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSaved(_task, wasEditing) {
    closeForm();
    notify(wasEditing ? 'Task saved.' : 'Task added.');
    onChanged();
  }

  async function handleToggle(task) {
    if (busyId) return;
    setBusyId(task._id);
    try {
      await updateTask(event._id, task._id, {
        status: task.status === 'completed' ? 'open' : 'completed'
      });
      onChanged();
    } catch (error) {
      notify(getErrorMessage(error, 'Could not update this task. Try again.'), 'danger');
    } finally {
      setBusyId('');
    }
  }

  async function handleSuggested() {
    if (suggesting) return;
    setSuggesting(true);
    try {
      const result = await addSuggestedTasks(event._id);
      notify(
        result.tasks.length
          ? result.message || 'Suggested tasks added.'
          : 'The suggested checklist is already in place.'
      );
      if (result.tasks.length) onChanged();
    } catch (error) {
      notify(getErrorMessage(error, 'Could not add the suggested tasks. Try again.'), 'danger');
    } finally {
      setSuggesting(false);
    }
  }

  function askDelete(task) {
    setDeleteError('');
    setDeleting(task);
  }

  function cancelDelete() {
    if (deleteLoading) return;
    setDeleting(null);
    setDeleteError('');
  }

  async function confirmDelete() {
    if (!deleting || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteTask(event._id, deleting._id);
      setDeleting(null);
      notify('Task deleted.');
      onChanged();
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Could not delete this task. Try again.'));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <section
        id="event-panel-tasks"
        role="tabpanel"
        aria-labelledby="event-tab-tasks"
        className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[1.35rem] leading-tight text-ink">Checklist</h2>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-muted">
              {total
                ? `${doneCount} of ${total} done${openCount ? ` · ${openCount} open` : ' · all clear'}`
                : 'Build the plan one step at a time.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSuggested}
              loading={suggesting}
              className="text-brand hover:bg-brand-soft hover:text-brand-hover"
            >
              <Sparkles size={15} aria-hidden="true" />
              {total ? 'Add suggested' : 'Suggested checklist'}
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus size={15} aria-hidden="true" />
              Add task
            </Button>
          </div>
        </div>

        {total ? (
          <>
            <div
              className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label="Checklist progress"
            >
              <span
                className="block h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            {overdueCount ? (
              <p className="mt-2 text-[0.78rem] text-danger">
                {overdueCount} overdue {overdueCount === 1 ? 'step needs' : 'steps need'} attention.
              </p>
            ) : null}
          </>
        ) : null}
      </section>

      {total ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {ordered.map((task) => (
            <TaskRow
              key={task._id}
              task={task}
              busy={busyId === task._id}
              onToggle={handleToggle}
              onEdit={openEdit}
              onDelete={askDelete}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-card border border-line bg-surface p-6 text-center shadow-card sm:p-8">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-brand/[0.08] text-brand">
            <ListChecks size={20} aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-display text-[1.2rem] leading-tight text-ink">No tasks yet</h2>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.87rem] leading-relaxed text-muted">
            Add your own step, or start from the usual checklist for this event type and trim
            what does not apply.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={handleSuggested} loading={suggesting}>
              <Sparkles size={15} aria-hidden="true" />
              Add suggested checklist
            </Button>
            <Button size="sm" variant="ghost" onClick={openCreate}>
              <Plus size={15} aria-hidden="true" />
              Add task
            </Button>
          </div>
        </div>
      )}

      <Drawer
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit task' : 'New task'}
        description={
          editing ? 'Change the name, deadline or priority.' : 'One step the team needs to finish.'
        }
        bodyClassName="min-h-0 flex-1 overflow-hidden p-0"
      >
        <EventTaskForm
          key={editing?._id || 'new'}
          eventId={event._id}
          task={editing}
          onSaved={handleSaved}
          onCancel={closeForm}
        />
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this task?"
        description={deleting ? `"${deleting.title}" will be removed from this checklist.` : ''}
        confirmLabel="Delete task"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
