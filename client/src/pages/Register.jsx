import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await register(form); navigate('/onboarding'); }
    catch (err) { setError(err.response?.data?.message || 'Could not create your account. Please try again.'); }
    finally { setSubmitting(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="mb-2 font-semibold text-indigo-600">EventSync</p><h1 className="mb-6 text-2xl font-bold text-slate-900">Create your account</h1>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mb-4 block text-sm font-medium text-slate-700">Your name<input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="mb-4 block text-sm font-medium text-slate-700">Business name <span className="font-normal text-slate-400">(optional)</span><input autoComplete="organization" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="mb-4 block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="mb-6 block text-sm font-medium text-slate-700">Password<input required type="password" minLength="6" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <button disabled={submitting} className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting ? 'Creating account…' : 'Create account'}</button>
        <p className="mt-5 text-center text-sm text-slate-600">Already registered? <Link className="font-medium text-indigo-600" to="/login">Log in</Link></p>
      </form>
    </main>
  );
}
