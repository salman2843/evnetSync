import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, CalendarDays, ClipboardList, LayoutDashboard, LogOut,
  Menu, PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon, Store,
  UsersRound, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from './Modal.jsx';

const navigation = [
  { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'Clients', to: '/clients', Icon: UsersRound },
  { label: 'Events', Icon: CalendarDays },
  { label: 'Vendors', Icon: Store },
  { label: 'Action Center', Icon: ClipboardList },
];

function NavigationItems({ onNavigate, collapsed = false }) {
  return <nav aria-label="Main navigation" className="space-y-1.5">
    {navigation.map(({ label, to, Icon }) => {
      const className = ({ isActive }) => `group flex min-h-11 items-center rounded-xl text-sm transition-colors duration-200 ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'} ${!to ? 'cursor-default opacity-60' : ''}`;
      const content = <><Icon aria-hidden="true" size={20} strokeWidth={1.8} /><span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? 'w-0 -translate-x-2 opacity-0' : 'w-auto translate-x-0 opacity-100'}`}>{label}</span></>;
      return to
        ? <NavLink key={label} to={to} onClick={onNavigate} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} className={className}>{content}</NavLink>
        : <div key={label} title={collapsed ? `${label} (coming soon)` : undefined} aria-label={`${label} (coming soon)`} className={className({ isActive: false })}>{content}</div>;
    })}
  </nav>;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const closeButtonRef = useRef(null);
  const menuButtonRef = useRef(null);

  function closeDrawer() {
    setDrawerVisible(false);
    window.setTimeout(() => setDrawerOpen(false), 300);
  }

  function startLogout() {
    setConfirmLogout(false);
    closeDrawer();
    logout();
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const frame = window.requestAnimationFrame(() => setDrawerVisible(true));
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !confirmLogout) closeDrawer();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen, confirmLogout]);

  useEffect(() => {
    closeDrawer();
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen && !drawerVisible) menuButtonRef.current?.focus({ preventScroll: true });
  }, [drawerOpen, drawerVisible]);

  const settingsLink = <NavLink to="/settings" onClick={closeDrawer} title={collapsed ? 'Settings' : undefined} aria-label={collapsed ? 'Settings' : undefined} className={({ isActive }) => `flex min-h-11 items-center rounded-xl text-sm transition-colors duration-200 ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><SettingsIcon size={20} strokeWidth={1.8} /><span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Settings</span></NavLink>;
  const logoutButton = <button type="button" onClick={() => setConfirmLogout(true)} title={collapsed ? 'Log out' : undefined} aria-label={collapsed ? 'Log out' : undefined} className={`flex min-h-11 w-full items-center rounded-xl text-sm text-slate-300 transition-colors duration-200 hover:bg-slate-800 hover:text-white ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'}`}><LogOut size={20} strokeWidth={1.8} /><span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Log out</span></button>;

  return <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
    <aside className={`group/sidebar relative hidden h-screen shrink-0 flex-col bg-slate-900 text-white transition-[width,padding] duration-300 ease-in-out md:sticky md:top-0 md:flex ${collapsed ? 'md:w-[76px] md:px-3 md:py-5' : 'md:w-64 md:p-6'}`}>
      <div className={`mb-8 flex min-h-10 items-center ${collapsed ? 'justify-center' : 'justify-between gap-2'}`}>
        <Link to="/dashboard" aria-label="EventSync home" className={`flex min-w-0 items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          <span title="App logo placeholder" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white"><CalendarDays size={21} strokeWidth={1.8} /></span>
          <span className={`overflow-hidden whitespace-nowrap text-xl font-bold tracking-tight transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>EventSync</span>
        </Link>
        <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:opacity-100 ${collapsed ? 'absolute -right-3 top-6 z-30 h-8 w-7 rounded-l-md rounded-r-lg border border-l-0 border-slate-600 bg-gradient-to-b from-slate-700 to-slate-800 text-white opacity-0 shadow-[0_3px_10px_rgba(15,23,42,0.24)] group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 hover:from-indigo-500 hover:to-indigo-600' : ''}`}>
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>
      </div>
      <NavigationItems collapsed={collapsed} />
      {!collapsed && <div className="mt-auto border-t border-slate-800 pt-4">
        {settingsLink}
        <div className="mt-1">{logoutButton}</div>
      </div>}
    </aside>

    <div className="min-w-0 flex-1 transition-[width,margin] duration-300 ease-in-out">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 md:px-8">
        <button ref={menuButtonRef} type="button" onClick={() => { setDrawerOpen(true); }} aria-label="Open navigation menu" className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"><Menu size={22} /></button>
        <div className="ml-auto flex min-w-0 max-w-[min(70vw,20rem)] items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-2 pr-3 shadow-sm">
          <span title="Business logo placeholder" aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Building2 size={17} strokeWidth={1.9} /></span>
          <span className="truncate text-sm font-semibold text-slate-700 sm:text-base">{user?.businessName || user?.name || 'Your business'}</span>
        </div>
      </header>
      <main className="p-4 transition-[padding] duration-300 sm:p-6 md:p-8 lg:p-10"><Outlet /></main>
    </div>

    {drawerOpen && <div className="fixed inset-0 z-40 md:hidden">
      <button type="button" aria-label="Close navigation menu" onClick={closeDrawer} className={`absolute inset-0 bg-slate-950/50 transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`} />
      <aside className={`absolute inset-y-0 left-0 flex w-[min(82vw,18rem)] flex-col bg-slate-900 p-5 text-white shadow-2xl transition-transform duration-300 ease-in-out ${drawerVisible ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <Link to="/dashboard" onClick={closeDrawer} className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500"><CalendarDays size={21} /></span><span className="text-xl font-bold tracking-tight">EventSync</span></Link>
          <button ref={closeButtonRef} type="button" onClick={closeDrawer} aria-label="Close navigation menu" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"><X size={21} /></button>
        </div>
        <NavigationItems onNavigate={closeDrawer} />
        <div className="mt-auto border-t border-slate-800 pt-4">{settingsLink}<div className="mt-1">{logoutButton}</div></div>
      </aside>
    </div>}

    {confirmLogout && <Modal title="Log out?" onClose={() => setConfirmLogout(false)}>
      <p className="text-sm leading-6 text-slate-600">Are you sure you want to log out of EventSync?</p>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmLogout(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Stay signed in</button><button type="button" onClick={startLogout} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Log out</button></div>
    </Modal>}
  </div>;
}
