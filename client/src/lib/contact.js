// One-click contact links. Phones are stored as E.164, so stripping the "+"
// gives the international number wa.me expects.
export function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export function whatsappLink(phone) {
  const digits = phoneDigits(phone);
  return digits ? `https://wa.me/${digits}` : '';
}

export function callLink(phone) {
  const number = String(phone || '').replace(/[^\d+]/g, '');
  return number ? `tel:${number}` : '';
}

export function emailLink(email) {
  return email ? `mailto:${email}` : '';
}

// Vendors store a full URL, but the card reads better without https://.
export function websiteLabel(url) {
  return String(url || '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');
}
