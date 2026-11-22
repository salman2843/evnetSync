// Pure helpers for the Action Center. The page fetches every action once and
// these functions decide what each filter shows, so the tabs feel instant.

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dueDay(action) {
  return action.dueAt ? startOfDay(action.dueAt) : null;
}

export const ACTION_FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Next 7 days' },
  { id: 'done', label: 'Done' }
];

function openActions(actions) {
  return actions.filter((action) => action.status === 'open');
}

// Counts match the wording the rows use: "Overdue by 2 days" starts tomorrow,
// anything due earlier today still belongs to Today.
export function actionCounts(actions, now = new Date()) {
  const today = startOfDay(now);
  // Include the seventh day ahead so a row that says "Due in 7 days" also
  // appears under Next 7 days.
  const weekEnd = today + 8 * DAY_MS;
  const open = openActions(actions);

  return {
    open: open.length,
    overdue: open.filter((action) => {
      const due = dueDay(action);
      return due !== null && due < today;
    }).length,
    today: open.filter((action) => dueDay(action) === today).length,
    week: open.filter((action) => {
      const due = dueDay(action);
      return due !== null && due >= today && due < weekEnd;
    }).length,
    done: actions.filter((action) => action.status !== 'open').length
  };
}

export function filterActions(actions, filter, now = new Date()) {
  const today = startOfDay(now);
  const weekEnd = today + 8 * DAY_MS;

  if (filter === 'done') {
    return actions
      .filter((action) => action.status !== 'open')
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.updatedAt || 0) -
          new Date(a.completedAt || a.updatedAt || 0)
      );
  }

  const open = openActions(actions);

  if (filter === 'overdue') {
    return open.filter((action) => {
      const due = dueDay(action);
      return due !== null && due < today;
    });
  }

  if (filter === 'today') {
    return open.filter((action) => dueDay(action) === today);
  }

  if (filter === 'week') {
    return open.filter((action) => {
      const due = dueDay(action);
      return due !== null && due >= today && due < weekEnd;
    });
  }

  return open;
}
