import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Drawer from '../components/ui/Drawer.jsx';
import Toast from '../components/ui/Toast.jsx';
import VendorCard from '../components/vendors/VendorCard.jsx';
import VendorForm from '../components/vendors/VendorForm.jsx';
import VendorsEmpty from '../components/vendors/VendorsEmpty.jsx';
import VendorsSkeleton from '../components/vendors/VendorsSkeleton.jsx';
import VendorsToolbar from '../components/vendors/VendorsToolbar.jsx';
import { deleteVendor } from '../api/vendors.js';
import { getVendorCategories } from '../api/meta.js';
import useVendors from '../hooks/useVendors.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import useToast from '../hooks/useToast.js';
import getErrorMessage from '../lib/apiError.js';
import { formatCount } from '../lib/format.js';
import usePageTitle from '../lib/usePageTitle.js';

export default function Vendors() {
  usePageTitle('Vendors');

  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchInput.trim(), 300);

  const { vendors, pagination, loading, error, reload } = useVendors({ search, category, page });
  const { notice, notify } = useToast();

  // Category labels come from the server catalog, so they are fetched once and
  // shared by the filter, the form and the cards.
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    getVendorCategories(controller.signal)
      .then(setCategories)
      .catch(() => setCategories([]));
    return () => controller.abort();
  }, []);
  const categoryLabels = Object.fromEntries(categories.map((item) => [item.id, item.label]));

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const total = pagination?.total ?? vendors.length;
  const filtered = Boolean(search) || Boolean(category);

  function handleSearchChange(value) {
    setSearchInput(value);
    setPage(1);
  }

  function handleCategoryChange(value) {
    setCategory(value);
    setPage(1);
  }

  function changePage(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0 });
  }

  function clearFilters() {
    setSearchInput('');
    setCategory('');
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(vendor) {
    setEditing(vendor);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSaved(_vendor, wasEditing) {
    closeForm();
    notify(wasEditing ? 'Vendor saved.' : 'Vendor added.');
    reload();
  }

  function askDelete(vendor) {
    setDeleteError('');
    setDeleting(vendor);
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
      await deleteVendor(deleting._id);
      setDeleting(null);
      notify('Vendor deleted.');
      if (vendors.length === 1 && page > 1) changePage(page - 1);
      else reload();
    } catch (requestError) {
      setDeleteError(getErrorMessage(requestError, 'Could not delete this vendor. Try again.'));
    } finally {
      setDeleteLoading(false);
    }
  }

  const deleteDescription = deleting
    ? deleting.assignmentCount
      ? `${deleting.name} is on ${formatCount(
          deleting.assignmentCount,
          'event',
          'events'
        )}. Remove those assignments first, then try again.`
      : `${deleting.name} will be removed from your vendor book permanently.`
    : '';

  // If the vendor is in use, or the server has just refused, the delete button
  // is spent: only Close is left, so nobody clicks it in a loop.
  const deleteBlocked = Boolean(deleting?.assignmentCount) || Boolean(deleteError);

  const isEmpty = !loading && vendors.length === 0;

  return (
    <div className="space-y-6">
      <Toast text={notice.text} tone={notice.tone} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-muted">
            Vendor book
          </p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-ink sm:text-[2.4rem]">
            Vendors
          </h1>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">
            The people who make the day happen, one tap away.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Add vendor
        </Button>
      </header>

      <VendorsToolbar
        search={searchInput}
        onSearchChange={handleSearchChange}
        category={category}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        total={total}
        loading={loading}
      />

      {error && vendors.length ? (
        <p className="rounded-field border border-danger/20 bg-danger/[0.05] px-3.5 py-2.5 text-[0.8rem] leading-snug text-danger">
          {error} Showing the last list that loaded.
        </p>
      ) : null}

      {error && !vendors.length && !loading ? (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="text-[0.95rem] font-semibold text-ink">Your vendors did not load</h2>
          <p className="mt-2 max-w-[46ch] text-[0.85rem] leading-relaxed text-muted">{error}</p>
          <Button size="sm" className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : loading && !vendors.length ? (
        <VendorsSkeleton />
      ) : isEmpty ? (
        <VendorsEmpty filtered={filtered} onAdd={openCreate} onClear={clearFilters} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor._id}
                vendor={vendor}
                categoryLabels={categoryLabels}
                onEdit={openEdit}
                onDelete={askDelete}
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
        title={editing ? 'Edit vendor' : 'New vendor'}
        description={
          editing
            ? 'Update what they do or how to reach them.'
            : 'Add someone you work with. Assign them to an event later.'
        }
        bodyClassName="min-h-0 flex-1 overflow-hidden p-0"
      >
        <VendorForm
          key={editing?._id || 'new'}
          vendor={editing}
          categories={categories}
          onSaved={handleSaved}
          onCancel={closeForm}
        />
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this vendor?"
        description={deleteDescription}
        confirmLabel="Delete vendor"
        cancelLabel={deleting?.assignmentCount ? 'Close' : 'Cancel'}
        confirmDisabled={deleteBlocked}
        loading={deleteLoading}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
