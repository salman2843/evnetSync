import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = ['Dashboard', 'Clients', 'Events', 'Vendors', 'Action Center'];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen md:flex">
      <aside className="w-full bg-slate-900 p-6 text-white md:min-h-screen md:w-64">
        <div className="mb-8 text-2xl font-bold">EventSync</div>
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {links.map((label) => <NavLink key={label} to={label === 'Dashboard' ? '/dashboard' : '#'} onClick={(event) => { if (label !== 'Dashboard') event.preventDefault(); }} className={({ isActive }) => `rounded-lg px-4 py-3 text-sm ${isActive && label === 'Dashboard' ? 'bg-slate-700' : 'text-slate-300 hover:bg-slate-800'}`}>{label}</NavLink>)}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <span className="font-medium text-slate-700">{user?.businessName || 'Planner workspace'}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Log out</button>
        </header>
        <main className="p-6 md:p-10"><Outlet /></main>
      </div>
    </div>
  );
}
