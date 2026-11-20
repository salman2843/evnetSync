import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Drawer from '../components/ui/Drawer.jsx';
import Toast from '../components/ui/Toast.jsx';
import ClientCard from '../components/clients/ClientCard.jsx';
import ClientForm from '../components/clients/ClientForm.jsx';
import ClientsEmpty from '../components/clients/ClientsEmpty.jsx';
import ClientsSkeleton from '../components/clients/ClientsSkeleton.jsx';
import ClientsToolbar from '../components/clients/ClientsToolbar.jsx';
import { deleteClient, updateClient } from '../api/clients.js';
import useClients from '../hooks/useClients.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import useToast from '../hooks/useToast.js';
import getErrorMessage from '../lib/apiError.js';
import { formatCount } from '../lib/format.js';
import usePageTitle from '../lib/usePageTitle.js';

export default function Clients() {
  usePageTitle('Clients');

  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchInput.trim(), 300);

  const { clients, pagination, loading, error, reload, patchClient } = useClients({
    search,
    status,
    sort,
    page
  });
  const { notice, notify } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [statusSavingId, setStatusSavingId] = useState('');

  const total = pagination?.total ?? clients.length;
  const filtered = Boolean(search) || status !== 'All';

  function handleSearchChange(value) {
    setSearchInput(value);
    if (page !== 1) setPage(1);
  }

  function handleStatusFilter(value) {
    setStatus(value);
    setPage(1);
  }

  function handleSort(value) {
    setSort(value);
    setPage(1);
  }

  function changePage(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0 });
  }

  function clearFilters() {
    setSearchInput('');
    setStatus('All');
    setSort('recent');
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(client) {
    setEditing(client);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSaved(_client, wasEditing) {
    closeForm();
    notify(wasEditing ? 'Client saved.' : 'Client added.');
    reload();
  }

  // The pill saves on change. Flip the card first, put it back if the server
  // refuses, and drop it from a filtered list when it no longer belongs.
  async function handleStatusChange(client, nextStatus) {
    if (client.status === nextStatus || statusSavingId) return;

    const previousStatus = client.status;
    patchClient(client._id, { status: nextStatus });
    setStatusSavingId(client._id);

    try {
      await updateClient(client._id, { status: nextStatus });
      notify(`Status changed to ${nextStatus}.`);
      if (status !== 'All' && nextStatus !== status) reload();
    } catch (requestError) {
      patchClient(client._id, { status: previousStatus });
      notify(getErrorMessage(requestError, 'Could not change the status. Try again.'), 'danger');
    } finally {
      setStatusSavingId('');
    }
  }

  function askDelete(client) {
    setDeleteError('');
    setDeleting(client);
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
      await deleteClient(deleting._id);
      setDeleting(null);
      notify('Client deleted.');
      if (clients.length === 1 && page > 1) changePage(page - 1);
      else reload();
    } catch (requestError) {
      setDeleteError(
        getErrorMessage(requestError, 'Could not delete this client. Try again.')
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  const deleteDescription = deleting
    ? deleting.eventCount
      ? `${deleting.name} has ${formatCount(
          deleting.eventCount,
          'event',
          'events'
        )}. Delete or move those events first, then try again.`
      : `${deleting.name}${
          deleting.status === 'Booked' ? ' is marked Booked' : ''
        }. Their contact details will be removed permanently.`
    : '';

  // A client with events, or a refused request, leaves only Close in the dialog.
  const deleteBlocked = Boolean(deleting?.eventCount) || Boolean(deleteError);

  const isEmpty = !loading && clients.length === 0;

  return (
    <div className="space-y-6">
      <Toast text={notice.text} tone={notice.tone} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-muted">
            Client book
          </p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-ink sm:text-[2.4rem]">
            Clients
          </h1>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">
            Everyone you plan for, with a direct line to each of them.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Add client
        </Button>
      </header>

      <ClientsToolbar
        search={searchInput}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusFilter}
        sort={sort}
        onSortChange={handleSort}
        total={total}
        loading={loading}
      />

      {error && clients.length ? (
        <p className="rounded-field border border-danger/20 bg-danger/[0.05] px-3.5 py-2.5 text-[0.8rem] leading-snug text-danger">
          {error} Showing the last list that loaded.
        </p>
      ) : null}

      {error && !clients.length && !loading ? (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="text-[0.95rem] font-semibold text-ink">Your clients did not load</h2>
          <p className="mt-2 max-w-[46ch] text-[0.85rem] leading-relaxed text-muted">{error}</p>
          <Button size="sm" className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : loading && !clients.length ? (
        <ClientsSkeleton />
      ) : isEmpty ? (
        <ClientsEmpty filtered={filtered} onAdd={openCreate} onClear={clearFilters} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => (
              <ClientCard
                key={client._id}
                client={client}
                statusSaving={statusSavingId === client._id}
                onEdit={openEdit}
                onDelete={askDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {pagination && pagination.pages > 1 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-[0.8rem] text-muted">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changePage(page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changePage(page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <Drawer
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit client' : 'New client'}
        description={
          editing
            ? 'Update the contact details, or move them along the pipeline.'
            : 'Capture the basics now. Events and budgets come later.'
        }
        bodyClassName="min-h-0 flex-1 overflow-hidden p-0"
      >
        <ClientForm
          key={editing?._id || 'new'}
          client={editing}
          onSaved={handleSaved}
          onCancel={closeForm}
        />
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this client?"
        description={deleteDescription}
        confirmLabel="Delete client"
        cancelLabel={deleting?.eventCount ? 'Close' : 'Cancel'}
        confirmDisabled={deleteBlocked}
        loading={deleteLoading}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
