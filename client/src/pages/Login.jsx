import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await login(form); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Could not log in. Please try again.'); }
    finally { setSubmitting(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="mb-2 font-semibold text-indigo-600">EventSync</p><h1 className="mb-6 text-2xl font-bold text-slate-900">Welcome back</h1>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mb-4 block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="mb-6 block text-sm font-medium text-slate-700">Password<input required type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <button disabled={submitting} className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting ? 'Logging in…' : 'Log in'}</button>
        <p className="mt-5 text-center text-sm text-slate-600">New to EventSync? <Link className="font-medium text-indigo-600" to="/register">Create an account</Link></p>
      </form>
    </main>
  );
}
