import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import BusinessMark from '../BusinessMark.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// The phone header has one account control: the planner's logo or monogram.
// It opens a small menu so Settings and Sign out no longer take two icons.
export default function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  // Tapping anywhere else, or pressing Escape, closes the menu. Escape puts
  // focus back on the mark so a keyboard user is not dropped at the page top.
  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-11 w-11 place-items-center rounded-full transition-colors duration-150 hover:bg-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <BusinessMark user={user} className="h-8 w-8" textClassName="text-[0.7rem]" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="menu-enter absolute right-0 top-full z-30 mt-2 w-60 origin-top-right rounded-card border border-line bg-surface p-1.5 shadow-card"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-[0.85rem] font-medium text-ink">{user?.name}</p>
            <p className="truncate text-[0.75rem] text-muted">{user?.email}</p>
          </div>

          <div className="my-1 h-px bg-line" />

          <NavLink
            to="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] items-center gap-3 rounded-field px-3 text-[0.88rem] text-ink-soft transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Settings size={17} className="text-muted" aria-hidden="true" />
            Profile &amp; settings
          </NavLink>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-field px-3 text-left text-[0.88rem] text-ink-soft transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <LogOut size={17} className="text-muted" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
