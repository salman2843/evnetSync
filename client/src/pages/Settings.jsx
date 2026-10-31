import { useState } from 'react';
import EventTypePicker from '../components/EventTypePicker.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { user, updatePlannerProfile } = useAuth();
  const [eventTypeIds, setEventTypeIds] = useState(user?.plannerProfile?.eventTypeIds || []);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updatePlannerProfile({ eventTypeIds });
      setMessage('Your event preferences are saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your preferences.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="mx-auto max-w-3xl">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700 sm:text-sm">Planner settings</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Shape your workspace</h1>
    <p className="mb-7 mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">Choose the event types you handle. These preferences guide future planning suggestions and never limit the kinds of events you can create.</p>
    <form onSubmit={saveSettings}>
      {message && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <EventTypePicker value={eventTypeIds} onChange={setEventTypeIds} />
      <div className="mt-6 flex justify-end"><button disabled={saving} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 disabled:translate-y-0 disabled:opacity-50 motion-reduce:transform-none">{saving ? 'Saving…' : 'Save preferences'}</button></div>
    </form>
  </section>;
}
