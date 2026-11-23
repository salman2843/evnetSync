import { NavLink, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  Store,
  Users
} from 'lucide-react';
import BrandMark from '../BrandMark.jsx';
import BusinessMark from '../BusinessMark.jsx';
import AccountMenu from './AccountMenu.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// One list drives the sidebar, the mobile tray and the page <title>.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/actions', label: 'Actions', icon: ListChecks },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/vendors', label: 'Vendors', icon: Store },
  { to: '/events', label: 'Events', icon: CalendarDays }
];

const TAB_ITEMS = NAV_ITEMS.slice(0, 5);

function NavItem({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-field px-3 py-2.5 text-[0.9rem]',
          'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
          isActive
            ? 'bg-surface font-medium text-ink shadow-field'
            : 'text-ink-soft hover:bg-wash hover:text-ink'
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            strokeWidth={isActive ? 2 : 1.75}
            className={isActive ? 'text-brand' : 'text-muted'}
            aria-hidden="true"
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-canvas px-4 py-6 lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <BrandMark className="h-7 w-7 text-brand" />
        <span className="font-display text-[1.15rem] tracking-[-0.01em] text-ink">EventSync</span>
      </div>

      <nav aria-label="Main" className="mt-9 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="mt-auto border-t border-line pt-4">
        <NavItem to="/settings" label="Settings" icon={Settings} />

        <div className="mt-4 flex items-center gap-3 px-2">
          <BusinessMark user={user} className="h-9 w-9" textClassName="text-[0.75rem]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.85rem] font-medium text-ink">{user?.name}</p>
            <p className="truncate text-[0.75rem] text-muted">
              {user?.businessName || 'Independent planner'}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-canvas/95 px-5 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <BrandMark className="h-6 w-6 text-brand" />
        <span className="font-display text-[1.05rem] tracking-[-0.01em] text-ink">EventSync</span>
      </div>
      <AccountMenu />
    </header>
  );
}

function MobileTabs() {
  const location = useLocation();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {TAB_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === '/dashboard' ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <li key={to}>
              <NavLink
                to={to}
                className={[
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 pb-1.5 pt-2',
                  'text-[0.65rem] font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40',
                  active ? 'text-brand' : 'text-muted hover:text-ink'
                ].join(' ')}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// The signed-in frame: fixed sidebar on desktop, tab bar on mobile. Pages only
// own their content.
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />

      <div className="lg:pl-64">
        <MobileHeader />
        <main className="mx-auto w-full max-w-[76rem] px-5 pb-28 pt-7 sm:px-8 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      <MobileTabs />
    </div>
  );
}
