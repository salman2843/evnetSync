import { useEffect, useState } from 'react';
import { Loader2, Mail, MessageCircle, Pencil, Phone, Plus, Store, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import Drawer from '../ui/Drawer.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import EventVendorForm from './EventVendorForm.jsx';
import {
  listEventVendors,
  removeEventVendor,
  updateEventVendor
} from '../../api/events.js';
import { getVendorCategories } from '../../api/meta.js';
import getErrorMessage from '../../lib/apiError.js';
import { callLink, emailLink, whatsappLink } from '../../lib/contact.js';
import { formatMoney } from '../../lib/format.js';
import { ASSIGNMENT_STATUS, ASSIGNMENT_STATUS_ORDER } from '../../lib/labels.js';

const STATUS_TEXT = {
  considering: 'text-ink-soft',
  contacted: 'text-brand',
  booked: 'text-success',
  declined: 'text-danger'
};

function VendorRow({ assignment, categoryLabels, busy, onEdit, onDelete, onStatus }) {
  const vendor = assignment.vendorId || {};
  const category = categoryLabels[assignment.serviceCategoryId] || 'Service not set';
  const whatsapp = whatsappLink(vendor.phone);
  const call = callLink(vendor.phone);
  const email = emailLink(vendor.email);

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[0.95rem] font-medium text-ink">{vendor.name || 'Vendor'}</h3>
            <Badge tone="neutral">{category}</Badge>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem] text-muted">
            {assignment.agreedAmount ? (
              <span className="font-medium text-ink-soft">
                {formatMoney(assignment.agreedAmount, assignment.currency)}
              </span>
            ) : (
              <span>No price agreed</span>
            )}
            {vendor.phone ? <span>{vendor.phone}</span> : null}
          </p>

          {assignment.notes ? (
            <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-relaxed text-muted">
              {assignment.notes}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <label className="sr-only" htmlFor={`assignment-status-${assignment._id}`}>
            Status for {vendor.name || 'this vendor'}
          </label>
          <select
            id={`assignment-status-${assignment._id}`}
            value={assignment.status}
            onChange={(event) => onStatus(assignment, event.target.value)}
            disabled={busy}
            className={[
              'h-11 rounded-field border border-line bg-surface px-2.5 text-[0.78rem] font-medium sm:h-9',
              'focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10',
              STATUS_TEXT[assignment.status] || 'text-ink-soft'
            ].join(' ')}
          >
            {ASSIGNMENT_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {ASSIGNMENT_STATUS[status].label}
              </option>
            ))}
          </select>

          {busy ? (
            <span className="grid h-11 w-9 place-items-center text-brand sm:h-9">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => onEdit(assignment)}
            aria-label={`Edit ${vendor.name || 'vendor'}`}
            className="grid h-11 w-9 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:h-9"
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(assignment)}
            aria-label={`Remove ${vendor.name || 'vendor'} from this event`}
            className="grid h-11 w-9 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-danger/[0.06] hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 sm:h-9"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {whatsapp || call || email ? (
        <div className="mt-2 flex flex-wrap gap-3 text-[0.78rem]">
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-brand hover:text-brand-hover"
            >
              <MessageCircle size={13} aria-hidden="true" />
              WhatsApp
            </a>
          ) : null}
          {call ? (
            <a
              href={call}
              className="inline-flex items-center gap-1.5 text-ink-soft hover:text-brand"
            >
              <Phone size={13} aria-hidden="true" />
              Call
            </a>
          ) : null}
          {email ? (
            <a
              href={email}
              className="inline-flex items-center gap-1.5 text-ink-soft hover:text-brand"
            >
              <Mail size={13} aria-hidden="true" />
              Email
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

// Vendors assigned to this event. Status can be changed straight from the row
// because tracking a booking is the everyday job; price, service and notes are
// edited in the sheet.
export default function EventVendorsPanel({ event, notify }) {
  const [state, setState] = useState({ assignments: [], loading: true, error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((current) => ({ ...current, loading: true, error: '' }));

    listEventVendors(event._id, controller.signal)
      .then((assignments) => {
        if (!active) return;
        setState({ assignments, loading: false, error: '' });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Could not load this event’s vendors. Try again.')
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [event._id, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    getVendorCategories(controller.signal)
      .then(setCategories)
      .catch(() => setCategories([]));
    return () => controller.abort();
  }, []);

  const categoryLabels = Object.fromEntries(categories.map((item) => [item.id, item.label]));
  const assignments = state.assignments;
  const booked = assignments.filter((assignment) => assignment.status === 'booked').length;
  const committed = assignments.reduce(
    (sum, assignment) => sum + Number(assignment.agreedAmount || 0),
    0
  );
  const assignedVendorIds = assignments
    .map((assignment) => assignment.vendorId?._id || assignment.vendorId)
    .filter(Boolean);

  function reload() {
    setReloadKey((value) => value + 1);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(assignment) {
    setEditing(assignment);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSaved(_assignment, wasEditing) {
    closeForm();
    notify(wasEditing ? 'Vendor assignment saved.' : 'Vendor assigned to the event.');
    reload();
  }

  async function handleStatus(assignment, status) {
    if (busyId) return;
    setBusyId(assignment._id);
    try {
      await updateEventVendor(event._id, assignment._id, { status });
      notify(`${assignment.vendorId?.name || 'Vendor'} is now ${ASSIGNMENT_STATUS[status].label.toLowerCase()}.`);
      reload();
    } catch (error) {
      notify(getErrorMessage(error, 'Could not update this vendor. Try again.'), 'danger');
    } finally {
      setBusyId('');
    }
  }

  function askDelete(assignment) {
    setDeleteError('');
    setDeleting(assignment);
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
      await removeEventVendor(event._id, deleting._id);
      setDeleting(null);
      notify('Vendor removed from the event.');
      reload();
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Could not remove this vendor. Try again.'));
    } finally {
      setDeleteLoading(false);
    }
  }

  const total = assignments.length;

  return (
    <div className="space-y-4">
      <section
        id="event-panel-vendors"
        role="tabpanel"
        aria-labelledby="event-tab-vendors"
        className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[1.35rem] leading-tight text-ink">Vendors</h2>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-muted">
              {total
                ? `${total} ${total === 1 ? 'vendor' : 'vendors'} · ${booked} booked${
                    committed ? ` · ${formatMoney(committed)} agreed` : ''
                  }`
                : 'Who is working on this event, and how far the booking has got.'}
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus size={15} aria-hidden="true" />
            Assign vendor
          </Button>
        </div>
      </section>

      {state.error ? (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="text-[0.95rem] font-semibold text-ink">Vendors did not load</h2>
          <p className="mt-2 max-w-[46ch] text-[0.85rem] leading-relaxed text-muted">
            {state.error}
          </p>
          <Button size="sm" className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : state.loading && !assignments.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {[0, 1].map((row) => (
            <li key={row} className="space-y-2 px-4 py-4 sm:px-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </li>
          ))}
        </ul>
      ) : total ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {assignments.map((assignment) => (
            <VendorRow
              key={assignment._id}
              assignment={assignment}
              categoryLabels={categoryLabels}
              busy={busyId === assignment._id}
              onEdit={openEdit}
              onDelete={askDelete}
              onStatus={handleStatus}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-card border border-line bg-surface p-6 text-center shadow-card sm:p-8">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-brand/[0.08] text-brand">
            <Store size={20} aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-display text-[1.2rem] leading-tight text-ink">
            No vendors on this event yet
          </h2>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.87rem] leading-relaxed text-muted">
            Assign someone from your vendor book, then track the quote and whether they are
            booked.
          </p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus size={15} aria-hidden="true" />
            Assign vendor
          </Button>
        </div>
      )}

      <Drawer
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit vendor assignment' : 'Assign a vendor'}
        description={
          editing
            ? 'Update the service, price, status or notes.'
            : 'Pick someone from your vendor book and record the deal.'
        }
        bodyClassName="min-h-0 flex-1 overflow-hidden p-0"
      >
        <EventVendorForm
          key={editing?._id || 'new'}
          eventId={event._id}
          assignment={editing}
          categories={categories}
          assignedVendorIds={assignedVendorIds}
          onSaved={handleSaved}
          onCancel={closeForm}
        />
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove this vendor?"
        description={
          deleting
            ? `${deleting.vendorId?.name || 'This vendor'} will be removed from the event. The vendor stays in your book.`
            : ''
        }
        confirmLabel="Remove vendor"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
