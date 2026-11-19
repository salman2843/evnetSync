import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Mail, MapPin, MessageCircle, MoreHorizontal, Phone } from 'lucide-react';
import Button from '../ui/Button.jsx';
import ClientStatusPill from './ClientStatusPill.jsx';
import { callLink, emailLink, whatsappLink } from '../../lib/contact.js';
import { formatCount, formatUpcomingDate } from '../../lib/format.js';

function EventLine({ client }) {
  if (!client.eventCount) {
    return (
      <p className="mt-4 flex items-center gap-1.5 text-[0.78rem] text-muted">
        <CalendarDays size={14} aria-hidden="true" />
        No events yet
      </p>
    );
  }

  return (
    <p className="mt-4 flex items-center gap-1.5 text-[0.78rem] text-muted">
      <CalendarDays size={14} aria-hidden="true" />
      {formatCount(client.eventCount, 'event', 'events')}
      {client.nextEventAt ? ` · next ${formatUpcomingDate(client.nextEventAt)}` : ' · none upcoming'}
    </p>
  );
}

// A client as a card, never a table row. The status pill is the quick edit; the
// menu holds the two destructive-or-rare actions.
export default function ClientCard({ client, statusSaving = false, onEdit, onDelete, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const subtitle = [client.company, client.source].filter(Boolean).join(' · ');
  const whatsapp = whatsappLink(client.phone);
  const phone = callLink(client.phone);
  const email = emailLink(client.email);

  return (
    <article className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <ClientStatusPill client={client} saving={statusSaving} onChange={onStatusChange} />

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={`More actions for ${client.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="grid h-11 w-11 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:h-9 sm:w-9"
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              aria-label={`Actions for ${client.name}`}
              className="absolute right-0 top-full z-20 mt-1 w-36 rounded-field border border-line bg-surface p-1 shadow-card"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(client);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-[0.85rem] text-ink-soft transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:bg-wash"
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(client);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-[0.85rem] text-danger transition-colors hover:bg-danger/[0.06] focus-visible:outline-none focus-visible:bg-danger/[0.06]"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <h3 className="mt-3 font-display text-[1.3rem] leading-tight tracking-[-0.01em] text-ink">
        {client.name}
      </h3>
      {subtitle ? <p className="mt-0.5 truncate text-[0.8rem] text-muted">{subtitle}</p> : null}

      <div className="mt-3 space-y-1.5 text-[0.83rem] leading-snug">
        <a
          href={phone}
          className="flex items-center gap-2 text-ink-soft transition-colors hover:text-brand"
        >
          <Phone size={14} aria-hidden="true" className="shrink-0 text-muted" />
          <span className="truncate">{client.phone}</span>
        </a>
        {email ? (
          <a
            href={email}
            className="flex items-center gap-2 text-ink-soft transition-colors hover:text-brand"
          >
            <Mail size={14} aria-hidden="true" className="shrink-0 text-muted" />
            <span className="truncate">{client.email}</span>
          </a>
        ) : null}
        {client.address ? (
          <p className="flex items-start gap-2 text-muted">
            <MapPin size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{client.address}</span>
          </p>
        ) : null}
      </div>

      <EventLine client={client} />

      {client.notes ? (
        <p className="mt-2 line-clamp-3 text-[0.83rem] leading-relaxed text-muted">{client.notes}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">
        <Button
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          variant="ghost"
          size="sm"
          aria-label={`WhatsApp ${client.name}`}
          className="text-brand hover:bg-brand-soft hover:text-brand-hover"
        >
          <MessageCircle size={15} aria-hidden="true" />
          WhatsApp
        </Button>
        <Button
          href={phone}
          variant="ghost"
          size="sm"
          aria-label={`Call ${client.name}`}
          className="hover:bg-wash"
        >
          <Phone size={15} aria-hidden="true" />
          Call
        </Button>
        {email ? (
          <Button
            href={email}
            variant="ghost"
            size="sm"
            aria-label={`Email ${client.name}`}
            className="hover:bg-wash"
          >
            <Mail size={15} aria-hidden="true" />
            Email
          </Button>
        ) : null}
      </div>
    </article>
  );
}
