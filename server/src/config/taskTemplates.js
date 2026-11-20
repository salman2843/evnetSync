// Suggested checklists for a new event. Each task counts backwards from the
// event date, so a planner gets a sane timeline without building one by hand.
// IDs match the event type catalog; group templates cover every type, and a few
// popular types get a more specific list.
import { eventTypeGroups } from './eventTypeCatalog.js';

export const taskTemplates = {
  social_private: [
    { title: 'Book the venue and confirm the address', dueOffsetDays: 60, priority: 'high' },
    { title: 'Confirm the guest list and send invitations', dueOffsetDays: 30 },
    { title: 'Book catering and agree the menu', dueOffsetDays: 21, priority: 'high' },
    { title: 'Confirm photography and videography', dueOffsetDays: 21 },
    { title: 'Finalise decor and styling', dueOffsetDays: 14 },
    { title: 'Share the final headcount with every vendor', dueOffsetDays: 3, priority: 'high' }
  ],
  corporate: [
    { title: 'Confirm the venue and meeting rooms', dueOffsetDays: 60, priority: 'high' },
    { title: 'Lock the programme and speaker list', dueOffsetDays: 45 },
    { title: 'Send the sponsor and partner decks', dueOffsetDays: 30 },
    { title: 'Confirm AV, sound and lighting', dueOffsetDays: 14, priority: 'high' },
    { title: 'Print signage, badges and handouts', dueOffsetDays: 7 },
    { title: 'Share the final run sheet with the team', dueOffsetDays: 2, priority: 'high' }
  ],
  public_large_scale: [
    { title: 'Confirm the venue, permits and insurance', dueOffsetDays: 90, priority: 'high' },
    { title: 'Lock the artist and production schedule', dueOffsetDays: 60 },
    { title: 'Publish the ticketing and promotion plan', dueOffsetDays: 45 },
    { title: 'Confirm security, medical and transport', dueOffsetDays: 21, priority: 'high' },
    { title: 'Finalise the stage plot and sound check', dueOffsetDays: 10 },
    { title: 'Send the final run sheet to all crews', dueOffsetDays: 2, priority: 'high' }
  ]
};

// Specific lists for the two event types planners create most often.
export const taskTemplateOverrides = {
  wedding: [
    { title: 'Book the venue and confirm the address', dueOffsetDays: 90, priority: 'high' },
    { title: 'Confirm the guest list and send invitations', dueOffsetDays: 45 },
    { title: 'Book catering and agree the menu', dueOffsetDays: 30, priority: 'high' },
    { title: 'Confirm photography and videography', dueOffsetDays: 30 },
    { title: 'Finalise decor, florals and styling', dueOffsetDays: 21 },
    { title: 'Confirm the ceremony schedule with the officiant', dueOffsetDays: 14 },
    { title: 'Share the final headcount with every vendor', dueOffsetDays: 3, priority: 'high' }
  ],
  conference: [
    { title: 'Confirm the venue and breakout rooms', dueOffsetDays: 75, priority: 'high' },
    { title: 'Lock the speaker list and session titles', dueOffsetDays: 45 },
    { title: 'Send the sponsor deck and exhibitor plan', dueOffsetDays: 30 },
    { title: 'Confirm AV, recording and live streaming', dueOffsetDays: 14, priority: 'high' },
    { title: 'Print badges, signage and handouts', dueOffsetDays: 7 },
    { title: 'Share the final run sheet with the crew', dueOffsetDays: 2, priority: 'high' }
  ]
};

// Fallback if a new type appears before its group template does.
export const defaultTaskTemplate = [
  { title: 'Confirm the venue and date', dueOffsetDays: 30, priority: 'high' },
  { title: 'Build the event checklist', dueOffsetDays: 21 },
  { title: 'Confirm the vendor line-up', dueOffsetDays: 14 },
  { title: 'Share the final plan with the client', dueOffsetDays: 3, priority: 'high' }
];

// eventTypeId -> group id, built from the one event type catalog.
const groupIdByType = new Map();
eventTypeGroups.forEach((group) => {
  group.types.forEach((type) => groupIdByType.set(type.id, group.id));
});

// Override first, then the type's group, then the generic fallback.
export function templateForEventType(eventTypeId) {
  return (
    taskTemplateOverrides[eventTypeId] ||
    taskTemplates[groupIdByType.get(eventTypeId)] ||
    defaultTaskTemplate
  );
}
