import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  return <section><p className="text-xs font-semibold text-indigo-600 sm:text-sm">Dashboard</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome, {user?.name}</h1></section>;
}
