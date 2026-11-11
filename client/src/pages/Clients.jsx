import { memo, useCallback, useEffect, useMemo, useState } from "react"
import {
  Calendar,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react"
import api from "../api/axios.js"
import Modal from "../components/Modal.jsx"
import { buildWhatsAppUrl } from "../utils/whatsapp.js"
import {
  formatPhoneForDisplay,
  isValidPhoneNumber,
  normalizePhoneDigits,
  splitStoredPhone,
} from "../utils/phone.js"

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const ALL = "All Clients"
const STATUSES = ["New", "Contacted", "Booked"]
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const COUNTRY_OPTIONS = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+65", label: "🇸🇬 +65" },
]
const KNOWN_CODES = new Set(COUNTRY_OPTIONS.map((option) => option.code))

const EMPTY_FORM = {
  name: "",
  phone: "",
  countryCode: "+91",
  customCountryCode: "",
  email: "",
  address: "",
  notes: "",
  status: "New",
}

// Palette: page #fff1f0, card border #f3e1de, primary #c17b7b,
// heading #8d5353, muted text #a87a7a, soft fill #f6e3e1
const BADGE_STYLES = {
  New: "bg-[#dbeafe] text-[#1d4ed8]",
  Contacted: "bg-[#dbeafe] text-[#a16a0c]",
  Booked: "bg-[#d9f7e4] text-[#1f8a4c]",
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[#bfdbfe] bg-white px-3 py-2.5 text-sm text-[#1e3a5f] outline-none transition placeholder:text-[#9fb3d1] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
const primaryBtn =
  "inline-flex items-center justify-center rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b82f6] disabled:opacity-60"
const softBtn =
  "inline-flex items-center justify-center rounded-lg bg-[#dbeafe] px-4 py-2 text-sm font-medium text-[#1d4ed8] transition hover:bg-[#bfdbfe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b82f6]"
const outlineBtn =
  "inline-flex items-center justify-center rounded-lg border border-[#bfdbfe] px-4 py-2 text-sm font-medium text-[#1e3a8a] transition hover:bg-[#eff6ff]"

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function clientToForm(client) {
  if (!client) return EMPTY_FORM
  const { countryCode, number } = splitStoredPhone(client.phone)
  const known = KNOWN_CODES.has(countryCode)
  return {
    name: client.name,
    phone: number,
    countryCode: known ? countryCode : "Custom",
    customCountryCode: known ? "" : countryCode,
    email: client.email || "",
    address: client.address || "",
    notes: client.notes || "",
    status: client.status || "New",
  }
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function StatusBadge({ status = "New" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${BADGE_STYLES[status] || BADGE_STYLES.New}`}
    >
      {status}
    </span>
  )
}

function Avatar({ name, size = "h-10 w-10" }) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-medium text-[#2563eb]`}
    >
      {name?.trim()?.charAt(0)?.toUpperCase() || "?"}
    </span>
  )
}

function Alert({ children }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
    >
      {children}
    </p>
  )
}

function SkeletonCard() {
  return (
    <div className="h-48 animate-pulse rounded-xl border border-[#dbeafe] bg-white" />
  )
}

/* ------------------------------------------------------------------ */
/* Client card                                                         */
/* ------------------------------------------------------------------ */

const ClientCard = memo(function ClientCard({ client, onView }) {
  const eventsCount = Number.isFinite(client.eventsCount)
    ? client.eventsCount
    : null

  return (
    <article className="rounded-xl border border-[#dbeafe] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <Avatar name={client.name} />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-[#1e3a8a]">
            {client.name}
          </h2>
          <div className="mt-1">
            <StatusBadge status={client.status} />
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-xs text-[#5f7ba8]">
        <li className="flex min-w-0 items-center gap-2">
          <Mail size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            {client.email || "No email provided"}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Phone size={14} className="shrink-0" aria-hidden="true" />
          <span>{formatPhoneForDisplay(client.phone)}</span>
        </li>
        {eventsCount !== null && (
          <li className="flex items-center gap-2">
            <Calendar size={14} className="shrink-0" aria-hidden="true" />
            <span>
              {eventsCount} {eventsCount === 1 ? "event" : "events"}
            </span>
          </li>
        )}
      </ul>

      <div className="mt-4 flex gap-2 border-t border-[#dbeafe] pt-4">
        <button
          type="button"
          onClick={() => onView(client)}
          className={`${primaryBtn} flex-1`}
        >
          View Details
        </button>
        <a
          href={buildWhatsAppUrl(client.phone)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Contact ${client.name} on WhatsApp`}
          className={softBtn}
        >
          Contact
        </a>
      </div>
    </article>
  )
})

/* ------------------------------------------------------------------ */
/* Add / edit form (owns its own state so typing never re-renders the  */
/* client list)                                                        */
/* ------------------------------------------------------------------ */

function ClientForm({ client, onSaved, onCancel }) {
  const [form, setForm] = useState(() => clientToForm(client))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")

    const countryCode =
      form.countryCode === "Custom" ? form.customCountryCode : form.countryCode
    const email = form.email.trim()

    if (!isValidPhoneNumber(countryCode, form.phone))
      return setError(
        "Choose a valid country code and enter exactly 10 phone digits.",
      )
    if (!EMAIL_PATTERN.test(email))
      return setError("Enter a valid email address.")

    const { countryCode: _cc, customCountryCode: _custom, ...rest } = form
    const payload = {
      ...rest,
      name: form.name.trim(),
      email,
      phone: `${countryCode}${form.phone}`,
    }

    setSaving(true)
    try {
      const { data } = client
        ? await api.put(`/clients/${client._id}`, payload)
        : await api.post("/clients", payload)
      onSaved(data.data.client, Boolean(client))
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not save the client."))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <label className="block text-sm font-medium text-[#1e3a8a]">
        Name *
        <input
          required
          autoFocus
          value={form.name}
          onChange={set("name")}
          className={inputClass}
        />
      </label>

      <div>
        <span className="block text-sm font-medium text-[#1e3a8a]">
          Phone *
        </span>
        <div className="mt-1 flex gap-2">
          <select
            aria-label="Country calling code"
            value={form.countryCode}
            onChange={set("countryCode")}
            className="w-28 rounded-lg border border-[#bfdbfe] bg-white px-2 py-2.5 text-sm text-[#1e3a5f] outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
            <option value="Custom">Custom</option>
          </select>

          {form.countryCode === "Custom" && (
            <input
              required
              aria-label="Custom country calling code"
              inputMode="tel"
              placeholder="+ code"
              value={form.customCountryCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  customCountryCode: event.target.value
                    .replace(/[^+\d]/g, "")
                    .slice(0, 5),
                }))
              }
              className="w-24 rounded-lg border border-[#bfdbfe] px-2 py-2.5 text-sm outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
            />
          )}

          <input
            required
            aria-label="Phone number"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            pattern="\d{10}"
            placeholder="10 digit number"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phone: normalizePhoneDigits(event.target.value),
              }))
            }
            className="min-w-0 flex-1 rounded-lg border border-[#bfdbfe] px-3 py-2.5 text-sm outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
          />
        </div>
      </div>

      <label className="block text-sm font-medium text-[#1e3a8a]">
        Email *
        <input
          required
          type="email"
          value={form.email}
          onChange={set("email")}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-[#1e3a8a]">
        Status
        <select
          value={form.status}
          onChange={set("status")}
          className={inputClass}
        >
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-[#1e3a8a]">
        Address
        <input
          value={form.address}
          onChange={set("address")}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-[#1e3a8a]">
        Notes
        <textarea
          rows={3}
          value={form.notes}
          onChange={set("notes")}
          className={inputClass}
        />
      </label>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className={outlineBtn}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "Saving…" : client ? "Save changes" : "Add Client"}
        </button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Details view                                                        */
/* ------------------------------------------------------------------ */

function ClientDetails({ client, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) return
    setDeleting(true)
    setError("")
    try {
      await onDelete(client)
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not delete the client."))
      setDeleting(false)
    }
  }

  const rows = [
    ["Email", client.email || "—"],
    ["Phone", formatPhoneForDisplay(client.phone)],
    ["Address", client.address || "NA"],
    ...(client.notes ? [["Notes", client.notes]] : []),
  ]

  return (
    <div className="space-y-4 text-sm text-[#1e3a8a]">
      {error && <Alert>{error}</Alert>}

      <div className="flex items-center gap-3">
        <Avatar name={client.name} size="h-11 w-11" />
        <div>
          <p className="font-medium">{client.name}</p>
          <div className="mt-1">
            <StatusBadge status={client.status} />
          </div>
        </div>
      </div>

      <dl className="space-y-2 text-[#5f7ba8]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="w-16 shrink-0 font-medium text-[#1e3a8a]">
              {label}
            </dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dbeafe] pt-4">
        <a
          href={buildWhatsAppUrl(client.phone)}
          target="_blank"
          rel="noreferrer"
          className={`${primaryBtn} gap-2`}
        >
          <MessageCircle size={16} aria-hidden="true" />
          Contact
        </a>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(client)}
            className={`${outlineBtn} gap-2`}
          >
            <Pencil size={16} aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 size={16} aria-hidden="true" />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  // null | { mode: "create" } | { mode: "edit" | "details", client }
  const [modal, setModal] = useState(null)

  const debouncedSearch = useDebouncedValue(search)

  // Fetch clients; the previous request is cancelled when the search changes.
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError("")
      try {
        const { data } = await api.get("/clients", {
          params: { search: debouncedSearch || undefined },
          signal: controller.signal,
        })
        setClients(Array.isArray(data?.data?.clients) ? data.data.clients : [])
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return
        setError(
          getErrorMessage(
            requestError,
            "Could not load clients. Check your connection and sign in again.",
          ),
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [debouncedSearch])

  const visibleClients = useMemo(
    () =>
      statusFilter === ALL
        ? clients
        : clients.filter((client) => (client.status || "New") === statusFilter),
    [clients, statusFilter],
  )

  const closeModal = useCallback(() => setModal(null), [])
  const openCreate = useCallback(() => setModal({ mode: "create" }), [])
  const openDetails = useCallback(
    (client) => setModal({ mode: "details", client }),
    [],
  )
  const openEdit = useCallback(
    (client) => setModal({ mode: "edit", client }),
    [],
  )

  const handleSaved = useCallback((saved, wasEdit) => {
    setClients((items) =>
      wasEdit
        ? items.map((item) => (item._id === saved._id ? saved : item))
        : [saved, ...items],
    )
    if (!wasEdit) {
      setSearch("")
      setStatusFilter(ALL)
    }
    setModal(null)
  }, [])

  const handleDelete = useCallback(async (client) => {
    await api.delete(`/clients/${client._id}`)
    setClients((items) => items.filter((item) => item._id !== client._id))
    setModal(null)
  }, [])

  const emptyTitle = clients.length
    ? "No clients in this status"
    : search
      ? "No clients match your search"
      : "No clients yet"

  return (
    <section className="min-h-full bg-[#eff6ff] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#1e3a8a]">Clients</h1>
          <p className="mt-1 text-sm text-[#7b93bd]">
            Manage your client relationships and contact information.
          </p>
        </div>
        <button type="button" onClick={openCreate} className={primaryBtn}>
          + Add Client
        </button>
      </div>

      {/* Search + filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#f0dcd9] bg-white px-3.5 shadow-sm focus-within:ring-2 focus-within:ring-[#c17b7b]/20">
          <Search
            size={17}
            className="shrink-0 text-[#7b93bd]"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search clients"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clients by name, email, or phone..."
            className="w-full bg-transparent py-3 text-sm text-[#1e3a5f] outline-none placeholder:text-[#9fb3d1]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="text-[#7b93bd] hover:text-[#1e3a8a]"
            >
              <X size={16} />
            </button>
          )}
        </label>

        <div className="flex items-center gap-2">
          <SlidersHorizontal
            size={17}
            className="text-[#7b93bd]"
            aria-hidden="true"
          />
          <select
            aria-label="Filter clients by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-xl border border-[#dbeafe] bg-white px-3.5 py-3 text-sm text-[#1e3a8a] shadow-sm outline-none focus:ring-2 focus:ring-[#3b82f6]/20 sm:w-40"
          >
            <option>{ALL}</option>
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <p className="mb-3 text-xs text-[#5f7ba8]">
        Showing {visibleClients.length}{" "}
        {visibleClients.length === 1 ? "client" : "clients"}
      </p>

      {/* List */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <SkeletonCard key={key} />
          ))}
        </div>
      ) : visibleClients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#bfdbfe] bg-white/70 px-5 py-14 text-center">
          <p className="font-medium text-[#1e3a8a]">{emptyTitle}</p>
          <p className="mt-1 text-sm text-[#5f7ba8]">
            {clients.length
              ? "Choose another status to see more clients."
              : "Add your first client to keep their details close at hand."}
          </p>
          {!clients.length && !search && (
            <button
              type="button"
              onClick={openCreate}
              className={`${primaryBtn} mt-4`}
            >
              Add your first client
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleClients.map((client) => (
            <ClientCard key={client._id} client={client} onView={openDetails} />
          ))}
        </div>
      )}

      {/* Modals */}
      {(modal?.mode === "create" || modal?.mode === "edit") && (
        <Modal
          title={modal.mode === "edit" ? "Edit Client" : "Add New Client"}
          onClose={closeModal}
        >
          <ClientForm
            client={modal.client}
            onSaved={handleSaved}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal?.mode === "details" && (
        <Modal title="Client Details" onClose={closeModal}>
          <ClientDetails
            client={modal.client}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </Modal>
      )}
    </section>
  )
}
