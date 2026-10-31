import { useEffect, useState } from "react"
import { MessageCircle, Search, UserRound } from "lucide-react"
import api from "../api/axios.js"
import Modal from "../components/Modal.jsx"
import { buildWhatsAppUrl } from "../utils/whatsapp.js"
import { useAuth } from "../context/AuthContext.jsx"

const codes = ["+91", "+1", "+44", "+61", "+971", "+65"]
const emptyForm = {
  name: "",
  phone: "",
  countryCode: "+91",
  email: "",
  address: "",
  notes: "",
  status: "New",
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Clients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Clients")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError("")
      try {
        // Fetch the complete search result once; status filtering stays in the UI so stale
        // or pre-status records cannot disappear because of an API status query.
        const { data } = await api.get("/clients", { params: { search } })
        if (active)
          setClients(
            Array.isArray(data?.data?.clients) ? data.data.clients : [],
          )
      } catch (e) {
        if (active)
          setError(
            e.response?.data?.message ||
              "Could not load clients. Check that the API is reachable and sign in again.",
          )
      } finally {
        if (active) setLoading(false)
      }
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search])
  function openCreate() {
    setEditingClient(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }
  function openEdit(client) {
    const match = client.phone.match(/^(\+\d{1,4})(\d{10})$/)
    setEditingClient(client)
    setForm({
      name: client.name,
      countryCode: match?.[1] || "+91",
      phone: match?.[2] || client.phone.replace(/\D/g, "").slice(-10),
      email: client.email || "",
      address: client.address || "",
      notes: client.notes || "",
      status: client.status || "New",
    })
    setError("")
    setModalOpen(true)
  }
  async function saveClient(event) {
    event.preventDefault()
    setError("")
    if (!/^\d{10}$/.test(form.phone))
      return setError("Phone number must contain exactly 10 digits.")
    if (form.email && !emailPattern.test(form.email))
      return setError("Enter a valid email address.")
    setSaving(true)
    const payload = {
      ...form,
      phone: `${form.countryCode}${form.phone}`,
      plannerName: user?.name || "",
    }
    delete payload.countryCode
    try {
      const response = editingClient
        ? await api.put(`/clients/${editingClient._id}`, payload)
        : await api.post("/clients", payload)
      const savedClient = response.data.data.client
      setClients((items) =>
        editingClient
          ? items.map((item) =>
              item._id === savedClient._id ? savedClient : item,
            )
          : [savedClient, ...items],
      )
      if (!editingClient) {
        setSearch("")
        setStatusFilter("All Clients")
      }
      setModalOpen(false)
    } catch (e) {
      setError(e.response?.data?.message || "Could not save the client.")
    } finally {
      setSaving(false)
    }
  }
  async function deleteClient(client) {
    if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) return
    try {
      await api.delete(`/clients/${client._id}`)
      setClients((items) => items.filter((item) => item._id !== client._id))
    } catch (e) {
      setError(e.response?.data?.message || "Could not delete the client.")
    }
  }
  const fields = (client) => (
    <>
      <div className="font-semibold text-slate-900">{client.name}</div>
      <a className="block text-sm text-slate-600" href={`tel:${client.phone}`}>
        {client.phone}
      </a>
      {client.email && (
        <div className="break-all text-sm text-slate-600">{client.email}</div>
      )}
      {client.address && (
        <div className="text-sm text-slate-500">{client.address}</div>
      )}
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
          {client.status || "New"}
        </span>
        <span className="flex items-center gap-1">
          <UserRound size={13} />
          {client.plannerName || "Planner"}
        </span>
      </div>
    </>
  )
  const visibleClients = clients.filter(
    (client) =>
      statusFilter === "All Clients" ||
      (client.status || "New") === statusFilter,
  )
  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-indigo-600">Workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Clients</h1>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Add Client
        </button>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
          <Search size={17} className="text-slate-400" />
          <input
            aria-label="Search clients"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients"
            className="w-full py-2.5 outline-none"
          />
        </label>
        <label className="sr-only" htmlFor="client-status-filter">
          Filter clients by status
        </label>
        <select
          id="client-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
        >
          <option>All Clients</option>
          <option>New</option>
          <option>Contacted</option>
          <option>Booked</option>
        </select>
      </div>
      {error && !modalOpen && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading clients…</p>
        ) : !visibleClients.length ? (
          <p className="p-8 text-center text-slate-500">
            {clients.length
              ? "No clients match this status."
              : search
                ? "No clients match your search."
                : "No clients yet. Add your first client."}
          </p>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {visibleClients.map((client) => (
                <article key={client._id} className="p-4">
                  {fields(client)}
                  <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-sm">
                    <a
                      aria-label={`Message ${client.name} on WhatsApp`}
                      title="WhatsApp"
                      href={buildWhatsAppUrl(client.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600"
                    >
                      <MessageCircle size={22} />
                    </a>
                    <button
                      onClick={() => openEdit(client)}
                      className="text-indigo-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteClient(client)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {[
                    "Client",
                    "Phone",
                    "Email",
                    "Status",
                    "Planner",
                    "Actions",
                  ].map((v) => (
                    <th key={v} className="px-4 py-3">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleClients.map((client) => (
                  <tr key={client._id}>
                    <td className="px-4 py-4 font-medium">
                      {client.name}
                      {client.address && (
                        <span className="block text-xs font-normal text-slate-500">
                          {client.address}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">{client.phone}</td>
                    <td className="px-4 py-4">{client.email || "—"}</td>
                    <td className="px-4 py-4">{client.status || "New"}</td>
                    <td className="px-4 py-4">
                      {client.plannerName || user?.name || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <a
                          aria-label={`Message ${client.name} on WhatsApp`}
                          title="WhatsApp"
                          href={buildWhatsAppUrl(client.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600"
                        >
                          <MessageCircle size={20} />
                        </a>
                        <button
                          onClick={() => openEdit(client)}
                          className="text-indigo-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteClient(client)}
                          className="text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
      {modalOpen && (
        <Modal
          title={editingClient ? "Edit Client" : "Add Client"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={saveClient} className="space-y-4">
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <label className="block text-sm font-medium">
              Name *
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Phone *
              <div className="mt-1 flex gap-2">
                <input
                  aria-label="Country calling code"
                  list="country-codes"
                  value={form.countryCode}
                  onChange={(e) =>
                    setForm({ ...form, countryCode: e.target.value })
                  }
                  pattern="\+[1-9]\d{0,3}"
                  required
                  className="w-24 rounded-lg border px-2 py-2"
                />
                <datalist id="country-codes">
                  {codes.map((code) => (
                    <option key={code} value={code} />
                  ))}
                </datalist>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength="10"
                  pattern="\d{10}"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  placeholder="10 digit number"
                  className="min-w-0 flex-1 rounded-lg border px-3 py-2"
                />
              </div>
            </label>
            <label className="block text-sm font-medium">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
              >
                <option>New</option>
                <option>Contacted</option>
                <option>Booked</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Address
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Notes
              <textarea
                rows="3"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border px-4 py-2"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white"
              >
                {saving ? "Saving…" : "Save Client"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}
