export function buildWhatsAppUrl(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : 'https://wa.me/';
}
