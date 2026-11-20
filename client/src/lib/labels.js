// Human labels for the enum values the API returns. Badge tones live here too so
// a status looks the same on every screen.

export const EVENT_STATUS = {
  inquiry: { label: 'Inquiry', tone: 'neutral' },
  planning: { label: 'Planning', tone: 'brand' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' }
};

// The order filters and pickers show the statuses in.
export const EVENT_STATUS_ORDER = ['inquiry', 'planning', 'confirmed', 'completed', 'cancelled'];

export const EVENT_TYPES = {
  conference: 'Conference',
  trade_show: 'Trade show',
  product_launch: 'Product launch',
  seminar: 'Seminar',
  awards_night: 'Awards night',
  team_building_retreat: 'Team-building retreat',
  wedding: 'Wedding',
  milestone_birthday: 'Milestone birthday',
  engagement_party: 'Engagement party',
  naming_ceremony: 'Naming ceremony',
  concert: 'Concert',
  festival: 'Festival',
  community_fundraiser: 'Community fundraiser',
  press_conference: 'Press conference'
};

export const ACTION_PRIORITY = {
  high: { label: 'High', dot: 'bg-danger' },
  normal: { label: 'Normal', dot: 'bg-brand' },
  low: { label: 'Low', dot: 'bg-line-strong' }
};

export const ASSIGNMENT_STATUS = {
  considering: 'Considering',
  contacted: 'Contacted',
  booked: 'Booked',
  declined: 'Declined'
};

export const CLIENT_STATUS = {
  New: { label: 'New', tone: 'neutral' },
  Contacted: { label: 'Contacted', tone: 'brand' },
  Booked: { label: 'Booked', tone: 'success' }
};

export const CLIENT_STATUS_ORDER = ['New', 'Contacted', 'Booked'];
// The short lead-source list offered in the client form.
export const CLIENT_SOURCES = ['Referral', 'Instagram', 'WhatsApp', 'Other'];
export const PREFERRED_CONTACTS = ['WhatsApp', 'Phone call', 'Email'];

export function eventStatus(status) {
  return EVENT_STATUS[status] || { label: status || 'Unknown', tone: 'neutral' };
}

export function clientStatus(status) {
  return CLIENT_STATUS[status] || { label: status || 'Unknown', tone: 'neutral' };
}

export function eventTypeLabel(eventTypeId) {
  return EVENT_TYPES[eventTypeId] || 'Event';
}
