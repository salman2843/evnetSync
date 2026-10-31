import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventTypePicker from '../components/EventTypePicker.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Onboarding() {
  const { user, updatePlannerProfile } = useAuth();
  const navigate = useNavigate();
  const [eventTypeIds, setEventTypeIds] = useState(user?.plannerProfile?.eventTypeIds || []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function finishSetup(preferences) {
    setSaving(true);
    setError('');
    try {
      await updatePlannerProfile({ eventTypeIds: preferences, completeOnboarding: true });
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return <main className="min-h-screen bg-[#f7f6f2] px-4 py-8 sm:px-8 sm:py-12">
    <div className="panel-enter mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between"><span className="text-lg font-bold tracking-tight text-slate-900">EventSync <span className="font-normal text-slate-400">/ planner setup</span></span><span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">01 — 01</span></div>
      <div className="mb-8 max-w-2xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700 sm:text-sm">Your planning practice</p><h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">What kinds of events do you bring to life{user?.name ? `, ${user.name.split(' ')[0]}` : ''}?</h1><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">Choose the work you do most. We’ll use it to tailor planning prompts and suggestions. You can change this any time.</p></div>
      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <EventTypePicker value={eventTypeIds} onChange={setEventTypeIds} />
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" disabled={saving} onClick={() => finishSetup([])} className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-white disabled:opacity-50">I’ll set this up later</button><button type="button" disabled={!eventTypeIds.length || saving} onClick={() => finishSetup(eventTypeIds)} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 disabled:translate-y-0 disabled:opacity-50 motion-reduce:transform-none">{saving ? 'Saving your workspace…' : 'Continue to workspace'}</button></div>
    </div>
  </main>;
}
