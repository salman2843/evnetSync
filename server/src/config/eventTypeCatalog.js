// Stable IDs are stored on events; labels can be updated without migrations.
// A type can carry `subtypes` (a wedding's mehndi, a festival's Diwali). The form
// shows the second picker only when that list is not empty, so new sub-types are
// a catalog edit, not a frontend change.

export const eventSubtypes = {
  wedding: [
    { id: 'haldi', label: 'Haldi' },
    { id: 'mehndi', label: 'Mehndi' },
    { id: 'sangeet', label: 'Sangeet' },
    { id: 'ceremony', label: 'Wedding ceremony' },
    { id: 'reception', label: 'Reception' }
  ],
  festival: [
    { id: 'diwali', label: 'Diwali' },
    { id: 'holi', label: 'Holi' },
    { id: 'navratri', label: 'Navratri' },
    { id: 'ganesh_chaturthi', label: 'Ganesh Chaturthi' },
    { id: 'durga_puja', label: 'Durga Puja' },
    { id: 'onam', label: 'Onam' },
    { id: 'baisakhi', label: 'Baisakhi' },
    { id: 'pongal', label: 'Pongal' },
    { id: 'eid', label: 'Eid' },
    { id: 'christmas', label: 'Christmas' },
    { id: 'new_year', label: "New Year's Eve" }
  ]
};

// Copies each type's sub-types onto it, so one shape reaches the API and the form.
const withSubtypes = (types) =>
  types.map((type) => ({ ...type, subtypes: eventSubtypes[type.id] || [] }));

export const eventTypeGroups = [
  {
    id: 'corporate',
    label: 'Corporate events',
    types: withSubtypes([
      { id: 'conference', label: 'Conference' },
      { id: 'trade_show', label: 'Trade show' },
      { id: 'product_launch', label: 'Product launch' },
      { id: 'seminar', label: 'Seminar' },
      { id: 'awards_night', label: 'Awards night' },
      { id: 'team_building_retreat', label: 'Team-building retreat' },
      { id: 'corporate_offsite', label: 'Corporate offsite' },
      { id: 'board_meeting', label: 'Board meeting' },
      { id: 'gala_dinner', label: 'Gala dinner' },
      { id: 'hackathon', label: 'Hackathon' },
      { id: 'job_fair', label: 'Job fair' },
      { id: 'annual_day', label: 'Annual day' }
    ])
  },
  {
    id: 'social_private',
    label: 'Social & private events',
    types: withSubtypes([
      { id: 'wedding', label: 'Wedding', subtypeLabel: 'Wedding function' },
      { id: 'engagement_party', label: 'Engagement party' },
      { id: 'milestone_birthday', label: 'Milestone birthday' },
      { id: 'anniversary', label: 'Anniversary' },
      { id: 'naming_ceremony', label: 'Naming ceremony' },
      { id: 'baby_shower', label: 'Baby shower' },
      { id: 'housewarming', label: 'Housewarming' },
      { id: 'retirement_party', label: 'Retirement party' },
      { id: 'reunion', label: 'Reunion' },
      { id: 'religious_ceremony', label: 'Religious ceremony' }
    ])
  },
  {
    id: 'public_large_scale',
    label: 'Public & large-scale events',
    types: withSubtypes([
      { id: 'concert', label: 'Concert' },
      { id: 'festival', label: 'Festival', subtypeLabel: 'Festival' },
      { id: 'exhibition', label: 'Exhibition' },
      { id: 'community_fundraiser', label: 'Community fundraiser' },
      { id: 'press_conference', label: 'Press conference' },
      { id: 'sports_event', label: 'Sports event' },
      { id: 'marathon', label: 'Marathon' },
      { id: 'cultural_program', label: 'Cultural programme' }
    ])
  },
  {
    id: 'other',
    label: 'Something else',
    types: withSubtypes([{ id: 'other', label: 'Other — type it in', custom: true }])
  }
];

export const eventTypeIds = eventTypeGroups.flatMap((group) => group.types.map((type) => type.id));

// Kept for the existing client contract; the grouped catalog now carries every
// type's sub-types, so new clients read `group.types[].subtypes`.
export const festivalSubtypes = eventSubtypes.festival;
export const festivalSubtypeIds = festivalSubtypes.map((subtype) => subtype.id);

export function subtypesForEventType(eventTypeId) {
  for (const group of eventTypeGroups) {
    const type = group.types.find((item) => item.id === eventTypeId);
    if (type) return type.subtypes;
  }
  return [];
}

export function isValidSubtype(eventTypeId, subtypeId) {
  return subtypesForEventType(eventTypeId).some((subtype) => subtype.id === subtypeId);
}
