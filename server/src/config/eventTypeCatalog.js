// Stable IDs are stored on planner profiles; labels can be updated without migrations.
export const eventTypeGroups = [
  {
    id: 'corporate',
    label: 'Corporate events',
    types: [
      { id: 'conference', label: 'Conference' },
      { id: 'trade_show', label: 'Trade show' },
      { id: 'product_launch', label: 'Product launch' },
      { id: 'seminar', label: 'Seminar' },
      { id: 'awards_night', label: 'Awards night' },
      { id: 'team_building_retreat', label: 'Team-building retreat' }
    ]
  },
  {
    id: 'social_private',
    label: 'Social & private events',
    types: [
      { id: 'wedding', label: 'Wedding' },
      { id: 'milestone_birthday', label: 'Milestone birthday' },
      { id: 'engagement_party', label: 'Engagement party' },
      { id: 'naming_ceremony', label: 'Naming ceremony' }
    ]
  },
  {
    id: 'public_large_scale',
    label: 'Public & large-scale events',
    types: [
      { id: 'concert', label: 'Concert' },
      { id: 'festival', label: 'Festival' },
      { id: 'community_fundraiser', label: 'Community fundraiser' },
      { id: 'press_conference', label: 'Press conference' }
    ]
  }
];

export const eventTypeIds = eventTypeGroups.flatMap((group) => group.types.map((type) => type.id));
