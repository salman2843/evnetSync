import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone
} from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { callLink, emailLink, websiteLabel, whatsappLink } from '../../lib/contact.js';
import { formatCount } from '../../lib/format.js';

// The vendor as a card, the same shape as a client card: what they do at the
// top, how to reach them in the middle, and the two rare actions in a menu.
export default function VendorCard({ vendor, categoryLabels = {}, onEdit, onDelete }) {
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

  const categories = (vendor.serviceCategoryIds || []).map((id) => ({
    id,
    label: categoryLabels[id] || id
  }));
  const visibleCategories = categories.slice(0, 2);
  const extraCategories = categories.length - visibleCategories.length;

  const whatsapp = whatsappLink(vendor.phone);
  const phone = callLink(vendor.phone);
  const email = emailLink(vendor.email);
  const hasActions = Boolean(whatsapp || phone || email);

  return (
    <article className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {visibleCategories.length ? (
            visibleCategories.map((category) => (
              <Badge key={category.id} tone="brand">
                {category.label}
              </Badge>
            ))
          ) : (
            <Badge tone="neutral">No service listed</Badge>
          )}
          {extraCategories > 0 ? <Badge tone="neutral">+{extraCategories}</Badge> : null}
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={`More actions for ${vendor.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="grid h-11 w-11 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:h-9 sm:w-9"
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              aria-label={`Actions for ${vendor.name}`}
              className="absolute right-0 top-full z-20 mt-1 w-36 rounded-field border border-line bg-surface p-1 shadow-card"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(vendor);
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
                  onDelete(vendor);
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
        {vendor.name}
      </h3>

      <div className="mt-3 space-y-1.5 text-[0.83rem] leading-snug">
        {phone ? (
          <a
            href={phone}
            className="flex items-center gap-2 text-ink-soft transition-colors hover:text-brand"
          >
            <Phone size={14} aria-hidden="true" className="shrink-0 text-muted" />
            <span className="truncate">{vendor.phone}</span>
          </a>
        ) : null}
        {email ? (
          <a
            href={email}
            className="flex items-center gap-2 text-ink-soft transition-colors hover:text-brand"
          >
            <Mail size={14} aria-hidden="true" className="shrink-0 text-muted" />
            <span className="truncate">{vendor.email}</span>
          </a>
        ) : null}
        {vendor.website ? (
          <a
            href={vendor.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-ink-soft transition-colors hover:text-brand"
          >
            <Globe size={14} aria-hidden="true" className="shrink-0 text-muted" />
            <span className="truncate">{websiteLabel(vendor.website)}</span>
            <ExternalLink size={12} aria-hidden="true" className="shrink-0 text-muted" />
          </a>
        ) : null}
        {vendor.address ? (
          <p className="flex items-start gap-2 text-muted">
            <MapPin size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{vendor.address}</span>
          </p>
        ) : null}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[0.78rem] text-muted">
        <CalendarDays size={14} aria-hidden="true" />
        {vendor.assignmentCount
          ? `On ${formatCount(vendor.assignmentCount, 'event', 'events')}`
          : 'Not on an event yet'}
      </p>

      {vendor.notes ? (
        <p className="mt-2 line-clamp-3 text-[0.83rem] leading-relaxed text-muted">{vendor.notes}</p>
      ) : null}

      {hasActions ? (
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">
          {whatsapp ? (
            <Button
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              variant="ghost"
              size="sm"
              aria-label={`WhatsApp ${vendor.name}`}
              className="text-brand hover:bg-brand-soft hover:text-brand-hover"
            >
              <MessageCircle size={15} aria-hidden="true" />
              WhatsApp
            </Button>
          ) : null}
          {phone ? (
            <Button
              href={phone}
              variant="ghost"
              size="sm"
              aria-label={`Call ${vendor.name}`}
              className="hover:bg-wash"
            >
              <Phone size={15} aria-hidden="true" />
              Call
            </Button>
          ) : null}
          {email ? (
            <Button
              href={email}
              variant="ghost"
              size="sm"
              aria-label={`Email ${vendor.name}`}
              className="hover:bg-wash"
            >
              <Mail size={15} aria-hidden="true" />
              Email
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
