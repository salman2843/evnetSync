import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  return <section><p className="text-sm font-semibold text-indigo-600">Dashboard</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome, {user?.name}</h1></section>;
}
