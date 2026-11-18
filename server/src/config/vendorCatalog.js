// Stable IDs stored in the database; labels can change without a migration.
export const vendorCategories = [
  { id: 'catering', label: 'Catering' },
  { id: 'decor', label: 'Decor & styling' },
  { id: 'photography', label: 'Photography' },
  { id: 'videography', label: 'Videography' },
  { id: 'sound_lighting', label: 'Sound & lighting' },
  { id: 'venue', label: 'Venue' },
  { id: 'makeup', label: 'Makeup & hair' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'florist', label: 'Florist' },
  { id: 'transport', label: 'Transport' },
  { id: 'printing', label: 'Printing & stationery' },
  { id: 'other', label: 'Other' }
];

export const vendorCategoryIds = vendorCategories.map((category) => category.id);
