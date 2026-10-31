import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import Modal from '../components/Modal.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/clients', { params: { search } });
        if (active) setClients(data.data.clients);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Could not load clients.');
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [search]);

  function openCreate() {
    setEditingClient(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(client) {
    setEditingClient(client);
    setForm({ name: client.name, phone: client.phone, email: client.email || '', address: client.address || '', notes: client.notes || '' });
    setError('');
    setModalOpen(true);
  }

  async function saveClient(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingClient) await api.put(`/clients/${editingClient._id}`, form);
      else await api.post('/clients', form);
      setModalOpen(false);
      const { data } = await api.get('/clients', { params: { search } });
      setClients(data.data.clients);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the client.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteClient(client) {
    if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    setError('');
    try {
      await api.delete(`/clients/${client._id}`);
      setClients((current) => current.filter((item) => item._id !== client._id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete the client.');
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-semibold text-indigo-600 sm:text-sm">Workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Clients</h1></div>
        <button onClick={openCreate} className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700">Add Client</button>
      </div>

      <label className="mb-4 block max-w-md text-sm font-medium text-slate-700">Search clients
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or phone" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
      </label>
      {error && !modalOpen && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? <p className="p-8 text-center text-slate-500">Loading clients…</p> : clients.length === 0 ? (
          <p className="p-8 text-center text-slate-500">{search ? 'No clients match your search.' : 'No clients yet. Add your first client to get started.'}</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Address</th><th className="px-5 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => <tr key={client._id}>
                <td className="px-5 py-4 font-medium text-slate-900">{client.name}</td><td className="px-5 py-4 text-slate-600">{client.phone}</td><td className="px-5 py-4 text-slate-600">{client.email || '—'}</td><td className="px-5 py-4 text-slate-600">{client.address || '—'}</td>
                <td className="px-5 py-4"><div className="flex items-center gap-3">
                  <a href={buildWhatsAppUrl(client.phone)} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 hover:underline">WhatsApp</a>
                  <button onClick={() => openEdit(client)} className="font-medium text-indigo-600 hover:underline">Edit</button>
                  <button onClick={() => deleteClient(client)} className="font-medium text-red-600 hover:underline">Delete</button>
                </div></td>
              </tr>)}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <Modal title={editingClient ? 'Edit Client' : 'Add Client'} onClose={() => setModalOpen(false)}>
        <form onSubmit={saveClient} className="space-y-4">
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <label className="block text-sm font-medium text-slate-700">Name *<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-700">Phone *<input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-700">Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-700">Address<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-700">Notes<textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700">Cancel</button><button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : editingClient ? 'Save changes' : 'Add Client'}</button></div>
        </form>
      </Modal>}
    </section>
  );
}
