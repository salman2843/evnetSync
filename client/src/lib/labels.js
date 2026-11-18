// Human labels for the enum values the API returns. Badge tones live here too so
// a status looks the same on every screen.

export const EVENT_STATUS = {
  inquiry: { label: 'Inquiry', tone: 'neutral' },
  planning: { label: 'Planning', tone: 'brand' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' }
};

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

export function eventStatus(status) {
  return EVENT_STATUS[status] || { label: status || 'Unknown', tone: 'neutral' };
}

export function eventTypeLabel(eventTypeId) {
  return EVENT_TYPES[eventTypeId] || 'Event';
}
