import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Check,
  Circle,
  DollarSign,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react"
import api from "../api/axios.js"
import Modal from "../components/Modal.jsx"
import { eventTypeGroups } from "../data/eventTypeCatalog.js"

const EMPTY_FORM = {
  clientId: "",
  title: "",
  eventTypeId: "",
  subEventTypeId: "",
  surpriseFor: "",
  status: "inquiry",
  startAt: "",
  budgetAmount: "",
  budgetSpent: "",
  budgetCurrency: "INR",
  notes: "",
}
const STATUS_LABELS = {
  inquiry: "Inquiry",
  planning: "Planning",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

// Theme: matches the Clients page (blue-600 primary, blue-50 panel, slate text, white rounded cards)
const STATUS_STYLES = {
  inquiry: "bg-blue-100 text-blue-700",
  planning: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-purple-100 text-purple-700",
  cancelled: "bg-slate-100 text-slate-600",
}
const INPUT =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
const CARD = "rounded-xl border border-slate-100 bg-white shadow-sm"
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
const BTN_SOFT =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"

const eventTypes = eventTypeGroups.flatMap((group) =>
  group.types.map((type) => ({ ...type, group: group.label })),
)
const FESTIVAL_SUBTYPES = [
  { id: "diwali", label: "Diwali" },
  { id: "holi", label: "Holi" },
  { id: "navratri", label: "Navratri" },
  { id: "ganesh_chaturthi", label: "Ganesh Chaturthi" },
  { id: "durga_puja", label: "Durga Puja" },
  { id: "onam", label: "Onam" },
]
const EVENT_TYPE_LABELS = Object.fromEntries(
  eventTypes.map((type) => [type.id, type.label]),
)
const money = (value, currency = "INR") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
const displayDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Date not set"

// ---- Column sort / filter options -------------------------------------------------
const TEXT_SORTS = [
  { id: "az", label: "A → Z (ascending)" },
  { id: "za", label: "Z → A (descending)" },
  { id: "latest", label: "Latest added" },
  { id: "oldest", label: "Oldest added" },
]
const DATE_SORTS = [
  { id: "nearest", label: "Nearest first (priority)" },
  { id: "upcoming", label: "Upcoming only" },
  { id: "past", label: "Past (gone) only" },
  { id: "latest", label: "Latest first" },
  { id: "oldest", label: "Oldest first" },
]
// header label -> { column key, options }
const COLUMN_FILTERS = {
  "Surprise For": { column: "surprise", options: TEXT_SORTS },
  Client: { column: "client", options: TEXT_SORTS },
  Date: { column: "date", options: DATE_SORTS },
}

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const eventTime = (event) =>
  event.startAt ? new Date(event.startAt).getTime() : null
// "Added" time: use createdAt when the API sends it, otherwise the timestamp embedded in a Mongo ObjectId.
const createdTime = (event) =>
  event.createdAt
    ? new Date(event.createdAt).getTime()
    : (parseInt(String(event._id).slice(0, 8), 16) || 0) * 1000
const byText = (getter, dir) => (a, b) => {
  const x = (getter(a) || "").trim()
  const y = (getter(b) || "").trim()
  if (!x && !y) return 0
  if (!x) return 1 // empty values always go last
  if (!y) return -1
  return dir * x.localeCompare(y, undefined, { sensitivity: "base" })
}
const byTime = (getter, dir) => (a, b) => {
  const x = getter(a)
  const y = getter(b)
  if (x === null && y === null) return 0
  if (x === null) return 1 // events without a date always go last
  if (y === null) return -1
  return dir * (x - y)
}

function applyColumnSort(list, { column, option }) {
  if (!column || !option) return list
  const items = [...list]

  if (column === "date") {
    const today = startOfToday()
    const upcoming = (e) => eventTime(e) !== null && eventTime(e) >= today
    const past = (e) => eventTime(e) !== null && eventTime(e) < today
    if (option === "upcoming")
      return items.filter(upcoming).sort(byTime(eventTime, 1))
    if (option === "past") return items.filter(past).sort(byTime(eventTime, -1))
    if (option === "latest") return items.sort(byTime(eventTime, -1))
    if (option === "oldest") return items.sort(byTime(eventTime, 1))
    // nearest: upcoming events soonest-first, then past events (most recent first), then undated
    return [
      ...items.filter(upcoming).sort(byTime(eventTime, 1)),
      ...items.filter(past).sort(byTime(eventTime, -1)),
      ...items.filter((e) => eventTime(e) === null),
    ]
  }

  const getter =
    column === "client" ? (e) => e.clientId?.name : (e) => e.surpriseFor
  if (option === "az") return items.sort(byText(getter, 1))
  if (option === "za") return items.sort(byText(getter, -1))
  if (option === "latest") return items.sort(byTime(createdTime, -1))
  if (option === "oldest") return items.sort(byTime(createdTime, 1))
  return items
}

// Small sort/filter menu that sits right beside a column heading.
// The menu is position: fixed so the table's overflow container cannot clip it.
function HeaderFilter({ label, options, value, onChange }) {
  const [pos, setPos] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const open = Boolean(pos)

  useEffect(() => {
    if (!open) return undefined
    const close = () => setPos(null)
    const onDown = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !buttonRef.current?.contains(e.target)
      )
        close()
    }
    const onKey = (e) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    window.addEventListener("resize", close)
    window.addEventListener("scroll", close, true)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", close)
      window.removeEventListener("scroll", close, true)
    }
  }, [open])

  function toggle() {
    if (open) {
      setPos(null)
      return
    }
    const rect = buttonRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 232)),
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={`Sort or filter by ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`rounded p-1 hover:bg-blue-100 hover:text-blue-700 ${value ? "bg-blue-100 text-blue-700" : "text-slate-400"}`}
      >
        <ArrowUpDown size={13} />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 w-56 rounded-xl border border-slate-100 bg-white p-1.5 text-left shadow-lg"
        >
          {options.map((option) => {
            const active = option.id === value
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(active ? "" : option.id)
                  setPos(null)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
              >
                {option.label}
                {active && <Check size={14} />}
              </button>
            )
          })}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("")
                setPos(null)
              }}
              className="mt-1 w-full rounded-lg border-t border-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:text-red-600"
            >
              Clear sorting
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function dateValue(value) {
  if (!value) return ""
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function BudgetProgress({ budget = {}, compact = false }) {
  const total = Number(budget.amount) || 0
  const spent = Number(budget.spent) || 0
  const hasBudget = total > 0
  const rawPercent = hasBudget ? Math.round((spent / total) * 100) : 0 // can exceed 100
  const barPercent = Math.min(100, rawPercent) // bar never overflows
  const isOver = hasBudget && spent > total
  const isNearLimit = hasBudget && !isOver && rawPercent >= 80
  const barColor = isOver
    ? "bg-red-500"
    : isNearLimit
      ? "bg-amber-500"
      : "bg-blue-600"
  const trackColor = isOver ? "bg-red-100" : "bg-blue-100"
  const overBy = money(spent - total, budget.currency)

  let footerRight = null
  if (!hasBudget)
    footerRight = spent > 0 ? "No total budget set" : "Budget not set"
  else if (isOver) footerRight = `${overBy} over budget`
  else if (!compact)
    footerRight = `${money(total - spent, budget.currency)} remaining`

  return (
    <div className={compact ? "min-w-36" : `${CARD} p-5`}>
      {!compact && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-500">Budget tracker</h3>
          {isOver && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              Over budget
            </span>
          )}
          {isNearLimit && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Almost at limit
            </span>
          )}
        </div>
      )}
      <div
        className={`flex justify-between gap-2 text-xs ${isOver ? "text-red-600" : "text-slate-500"} ${compact ? "" : "mt-3"}`}
      >
        <span>{money(spent, budget.currency)} spent</span>
        <span>{money(total, budget.currency)}</span>
      </div>
      <div
        className={`mt-1.5 overflow-hidden rounded-full ${trackColor} ${compact ? "h-1.5" : "h-3"}`}
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${barPercent}%` }}
        />
      </div>
      <div
        className={`mt-1 flex justify-between gap-2 ${compact ? "text-[11px]" : "text-xs"} ${isOver ? "font-medium text-red-600" : "text-slate-500"}`}
      >
        <span>{hasBudget ? `${rawPercent}% used` : "—"}</span>
        {footerRight && <span>{footerRight}</span>}
      </div>
    </div>
  )
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(null)
  const [tasks, setTasks] = useState([])
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDueAt, setTaskDueAt] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState("")
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [columnSort, setColumnSort] = useState({ column: "", option: "" }) // one active column sort at a time

  // silent = refresh in the background without flashing the "Loading events…" state
  async function loadData(silent = false) {
    if (!silent) setLoading(true)
    setError("")
    try {
      const [eventResponse, clientResponse] = await Promise.all([
        api.get("/events"),
        api.get("/clients"),
      ])
      setEvents(eventResponse.data.data.events)
      setClients(clientResponse.data.data.clients)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load events. Please try again.",
      )
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function openDetails(event) {
    setError("")
    try {
      const response = await api.get(`/events/${event._id}`)
      setSelected(response.data.data.event)
      setTasks(response.data.data.tasks)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not load event details.",
      )
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreate() {
    setEditingId("")
    setForm({ ...EMPTY_FORM, clientId: clients[0]?._id || "" })
    setFormError("")
    setDialogOpen(true)
  }
  function openEdit(event) {
    setEditingId(event._id)
    setForm({
      clientId: event.clientId?._id || event.clientId,
      title: event.title,
      eventTypeId: event.eventTypeId,
      subEventTypeId: event.subEventTypeId || "",
      surpriseFor: event.surpriseFor || "",
      status: event.status,
      startAt: dateValue(event.startAt),
      budgetAmount: event.budget?.amount ?? "",
      budgetSpent: event.budget?.spent ?? "",
      budgetCurrency: event.budget?.currency || "INR",
      notes: event.notes || "",
    })
    setFormError("")
    setDialogOpen(true)
  }
  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function saveEvent(event) {
    event.preventDefault()
    setFormError("")
    const totalBudget = Number(form.budgetAmount) || 0
    const spentBudget = Number(form.budgetSpent) || 0
    if (totalBudget < 0 || spentBudget < 0)
      return setFormError("Budget amounts cannot be negative.")
    if (spentBudget > 0 && totalBudget <= 0)
      return setFormError("Enter a total budget before recording spending.")
    // Spending more than the total is allowed on purpose: the tracker shows it as "over budget".
    setSaving(true)
    const payload = {
      clientId: form.clientId,
      title: form.title,
      eventTypeId: form.eventTypeId,
      subEventTypeId: form.subEventTypeId,
      surpriseFor: form.surpriseFor,
      status: form.status,
      startAt: form.startAt,
      budget: {
        amount: form.budgetAmount || 0,
        spent: form.budgetSpent || 0,
        currency: form.budgetCurrency,
      },
      notes: form.notes,
    }
    try {
      if (editingId) await api.put(`/events/${editingId}`, payload)
      else await api.post("/events", payload)
      setDialogOpen(false)
      await loadData(true)
      if (selected?._id === editingId) await openDetails({ _id: editingId })
    } catch (requestError) {
      setFormError(
        requestError.response?.data?.message || "Could not save this event.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeEvent(event) {
    if (
      !window.confirm(
        `Delete "${event.title}" and its tasks? This cannot be undone.`,
      )
    )
      return
    try {
      await api.delete(`/events/${event._id}`)
      setEvents((current) => current.filter((item) => item._id !== event._id))
      if (selected?._id === event._id) setSelected(null)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not delete this event.",
      )
    }
  }

  async function addTask(event) {
    event.preventDefault()
    if (!taskTitle.trim()) return
    try {
      const response = await api.post(`/events/${selected._id}/tasks`, {
        title: taskTitle,
        dueAt: taskDueAt || null,
      })
      setTasks((current) => [...current, response.data.data.task])
      setTaskTitle("")
      setTaskDueAt("")
      await loadData(true)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not add the task.",
      )
    }
  }

  async function toggleTask(task) {
    try {
      const response = await api.put(
        `/events/${selected._id}/tasks/${task._id}`,
        { status: task.status === "completed" ? "open" : "completed" },
      )
      setTasks((current) =>
        current.map((item) =>
          item._id === task._id ? response.data.data.task : item,
        ),
      )
      await loadData(true)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not update the task.",
      )
    }
  }

  async function removeTask(task) {
    try {
      await api.delete(`/events/${selected._id}/tasks/${task._id}`)
      setTasks((current) => current.filter((item) => item._id !== task._id))
      await loadData(true)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not remove the task.",
      )
    }
  }

  const matchedEvents = events.filter((event) => {
    const clientName = event.clientId?.name || ""
    const haystack =
      `${event.title} ${event.eventTypeId} ${EVENT_TYPE_LABELS[event.eventTypeId] || ""} ${event.subEventTypeId || ""} ${clientName} ${event.surpriseFor || ""}`.toLowerCase()
    return (
      (!statusFilter || event.status === statusFilter) &&
      haystack.includes(search.toLowerCase().trim())
    )
  })
  const filteredEvents = applyColumnSort(matchedEvents, columnSort)

  const completedCount = tasks.filter(
    (task) => task.status === "completed",
  ).length
  const taskPercent = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0

  return (
    <section className="mx-auto max-w-7xl rounded-2xl bg-blue-50 p-6 sm:p-8">
      {selected ? (
        <>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} /> Back to Events
          </button>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">
                {selected.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Event details and task management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_STYLES[selected.status]}`}
              >
                {STATUS_LABELS[selected.status]}
              </span>
              <button
                type="button"
                onClick={() => openEdit(selected)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                <Pencil size={14} /> Edit
              </button>
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Client",
                selected.clientId?.name || "Client",
                UserRound,
                "bg-blue-100 text-blue-600",
              ],
              [
                "Surprise for",
                selected.surpriseFor || "Not specified",
                UserRound,
                "bg-purple-100 text-purple-600",
              ],
              [
                "Event date",
                displayDate(selected.startAt),
                CalendarDays,
                "bg-green-100 text-green-600",
              ],
              [
                "Total budget",
                money(selected.budget?.amount, selected.budget?.currency),
                DollarSign,
                "bg-orange-100 text-orange-600",
              ],
            ].map(([label, value, Icon, tone]) => (
              <div key={label} className={`${CARD} p-5`}>
                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon size={18} />
                </div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 font-semibold text-blue-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <BudgetProgress budget={selected.budget} />
          </div>

          {selected.notes && (
            <div className={`mt-4 ${CARD} p-5`}>
              <h2 className="text-sm font-semibold text-blue-900">
                Event notes
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {selected.notes}
              </p>
            </div>
          )}

          <div className={`mt-4 ${CARD} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-blue-900">Tasks</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {completedCount} / {tasks.length} completed
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {taskPercent}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${taskPercent}%` }}
              />
            </div>
            <form
              onSubmit={addTask}
              className="mt-4 grid gap-2 sm:grid-cols-[1fr_12rem_auto]"
            >
              <input
                className={INPUT}
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Add a task"
                aria-label="New task"
              />
              <input
                className={INPUT}
                type="date"
                value={taskDueAt}
                onChange={(event) => setTaskDueAt(event.target.value)}
                aria-label="Task due date"
              />
              <button
                type="submit"
                className={`${BTN_PRIMARY} mt-1 min-h-10 shrink-0`}
              >
                <Plus size={16} /> Add
              </button>
            </form>
            <ul className="mt-3 space-y-2">
              {tasks.map((task) => (
                <li
                  key={task._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className={`flex items-center gap-2 text-left text-sm ${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-800"}`}
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2
                          size={17}
                          className="shrink-0 text-blue-600"
                        />
                      ) : (
                        <Circle size={17} className="shrink-0 text-blue-600" />
                      )}
                      <span className="truncate">{task.title}</span>
                    </button>
                    {task.dueAt && (
                      <p className="ml-6 mt-1 text-xs text-slate-500">
                        Due {new Date(task.dueAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTask(task)}
                    aria-label={`Delete task ${task.title}`}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Events</h1>
              <p className="mt-2 text-sm text-slate-500">
                Track and manage your events.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              disabled={!clients.length}
              className={BTN_PRIMARY}
            >
              <Plus size={17} /> New Event
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
              <Search size={19} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events by type, client, or recipient..."
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 shadow-sm">
              <Filter size={17} />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter events by status"
                className="bg-transparent pr-1 text-sm text-slate-700 outline-none"
              >
                <option value="">All Events</option>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Showing {filteredEvents.length}{" "}
            {filteredEvents.length === 1 ? "event" : "events"}
          </p>
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className={`mt-3 overflow-hidden ${CARD}`}>
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading events…
              </div>
            ) : filteredEvents.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Event Type",
                        "Surprise For",
                        "Client",
                        "Date",
                        "Budget",
                        "Status",
                        "Actions",
                      ].map((heading) => {
                        const config = COLUMN_FILTERS[heading]
                        return (
                          <th
                            key={heading}
                            className="border-b border-slate-100 px-5 py-4 text-xs font-semibold text-blue-900"
                          >
                            {config ? (
                              <HeaderFilter
                                label={heading}
                                options={config.options}
                                value={
                                  columnSort.column === config.column
                                    ? columnSort.option
                                    : ""
                                }
                                onChange={(option) =>
                                  setColumnSort(
                                    option
                                      ? { column: config.column, option }
                                      : { column: "", option: "" },
                                  )
                                }
                              />
                            ) : (
                              heading
                            )}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => {
                      const summary = event.taskSummary || {
                        total: 0,
                        completed: 0,
                      }
                      const type =
                        EVENT_TYPE_LABELS[event.eventTypeId] ||
                        event.eventTypeId
                      const sub =
                        FESTIVAL_SUBTYPES.find(
                          (subtype) => subtype.id === event.subEventTypeId,
                        )?.label || event.subEventTypeId
                      return (
                        <tr
                          key={event._id}
                          className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-800">
                              <CalendarDays
                                size={16}
                                className="shrink-0 text-blue-600"
                              />
                              <span>
                                {type}
                                {sub ? ` · ${sub}` : ""}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <UserRound size={15} />
                              {event.surpriseFor || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {event.clientId?.name || "—"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {displayDate(event.startAt)}
                          </td>
                          <td className="px-5 py-4">
                            <BudgetProgress budget={event.budget} compact />
                            <p className="mt-1 text-[11px] text-slate-500">
                              {summary.completed}/{summary.total} tasks
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLES[event.status]}`}
                            >
                              {STATUS_LABELS[event.status]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openDetails(event)}
                                className={`${BTN_PRIMARY} whitespace-nowrap`}
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEvent(event)}
                                aria-label={`Delete ${event.title}`}
                                className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-14 text-center">
                <CalendarDays size={28} className="mx-auto text-blue-600" />
                <h2 className="mt-4 font-semibold text-blue-900">
                  No events found
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create an event or adjust your search and filters.
                </p>
                {clients.length > 0 && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Create your first event
                  </button>
                )}
              </div>
            )}
          </div>
          {!clients.length && !loading && (
            <p className="mt-4 text-sm text-slate-500">
              Add a client in Clients before creating an event.
            </p>
          )}
        </>
      )}

      {dialogOpen && (
        <Modal
          title={editingId ? "Edit event" : "New event"}
          onClose={() => setDialogOpen(false)}
        >
          <form onSubmit={saveEvent} className="space-y-4">
            {formError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {formError}
              </p>
            )}
            <label className="block text-sm font-medium text-blue-900">
              Event name
              <input
                className={INPUT}
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                maxLength={120}
                required
                placeholder="e.g. Asha & Rohan's wedding"
              />
            </label>
            <label className="block text-sm font-medium text-blue-900">
              Client
              <select
                className={INPUT}
                value={form.clientId}
                onChange={(event) =>
                  updateField("clientId", event.target.value)
                }
                required
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-blue-900">
              Event type
              <select
                className={INPUT}
                value={form.eventTypeId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    eventTypeId: event.target.value,
                    subEventTypeId: "",
                  }))
                }
                required
              >
                <option value="">Select an event type</option>
                {eventTypeGroups.map((group) => (
                  <optgroup key={group.id} label={group.label}>
                    {group.types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {form.eventTypeId === "festival" && (
              <label className="block text-sm font-medium text-blue-900">
                Festival type
                <select
                  className={INPUT}
                  value={form.subEventTypeId}
                  onChange={(event) =>
                    updateField("subEventTypeId", event.target.value)
                  }
                >
                  <option value="">Choose a festival (optional)</option>
                  {FESTIVAL_SUBTYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-sm font-medium text-blue-900">
              Surprise for{" "}
              <span className="font-normal text-slate-500">(optional)</span>
              <input
                className={INPUT}
                value={form.surpriseFor}
                onChange={(event) =>
                  updateField("surpriseFor", event.target.value)
                }
                maxLength={120}
                placeholder="Name or relationship"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-blue-900">
                Event date
                <input
                  type="date"
                  className={INPUT}
                  value={form.startAt}
                  onChange={(event) =>
                    updateField("startAt", event.target.value)
                  }
                  required
                />
              </label>
              <label className="block text-sm font-medium text-blue-900">
                Status
                <select
                  className={INPUT}
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset className="grid gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-3">
              <legend className="px-1 text-sm font-medium text-blue-900">
                Budget
              </legend>
              <label className="text-xs font-medium text-slate-500">
                Total
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={INPUT}
                  value={form.budgetAmount}
                  onChange={(event) =>
                    updateField("budgetAmount", event.target.value)
                  }
                  placeholder="0"
                />
              </label>
              <label className="text-xs font-medium text-slate-500">
                Spent
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={INPUT}
                  value={form.budgetSpent}
                  onChange={(event) =>
                    updateField("budgetSpent", event.target.value)
                  }
                  placeholder="0"
                />
              </label>
              <label className="text-xs font-medium text-slate-500">
                Currency
                <select
                  className={INPUT}
                  value={form.budgetCurrency}
                  onChange={(event) =>
                    updateField("budgetCurrency", event.target.value)
                  }
                >
                  <option value="INR">INR ₹</option>
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                  <option value="GBP">GBP £</option>
                </select>
              </label>
            </fieldset>
            {Number(form.budgetSpent) > Number(form.budgetAmount) &&
              Number(form.budgetAmount) > 0 && (
                <p className="-mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                  Spent is higher than the total budget by{" "}
                  {money(
                    Number(form.budgetSpent) - Number(form.budgetAmount),
                    form.budgetCurrency,
                  )}
                  . It will be shown as over budget.
                </p>
              )}
            <label className="block text-sm font-medium text-blue-900">
              Notes{" "}
              <span className="font-normal text-slate-500">(optional)</span>
              <textarea
                className={`${INPUT} max-h-40 min-h-24 resize-y`}
                rows={3}
                maxLength={2000}
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Initial event details"
              />
            </label>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Create event"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}
