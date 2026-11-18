import './helpers/testEnv.js';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  budgetRule,
  buildActions,
  eventConfirmationRule,
  missingTasksRule,
  missingVendorRule,
  taskDueRule,
  vendorConfirmationRule
} from '../src/services/actionEngine.js';

// Pure tests: no database, no app. Just data in, actions out.
const today = new Date('2026-11-18T09:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const days = (count) => new Date(today.getTime() + count * DAY);

function makeEvent(overrides = {}) {
  return {
    _id: 'event-1',
    clientId: 'client-1',
    title: 'Ravi Wedding',
    status: 'planning',
    startAt: days(5),
    budget: { amount: 0, spent: 0, currency: 'INR' },
    ...overrides
  };
}

describe('action engine rules', () => {
  test('flags an overdue task as high priority', () => {
    const actions = taskDueRule({
      tasks: [{ _id: 'task-1', eventId: 'event-1', title: 'Book caterer', status: 'open', dueAt: days(-2) }],
      events: [makeEvent()],
      today
    });

    assert.equal(actions.length, 1);
    assert.equal(actions[0].dedupeKey, 'task:task-1');
    assert.equal(actions[0].priority, 'high');
    assert.match(actions[0].title, /Overdue task/);
  });

  test('ignores tasks due later than a week, completed tasks, and closed events', () => {
    const actions = taskDueRule({
      tasks: [
        { _id: 'task-1', eventId: 'event-1', title: 'Far away', status: 'open', dueAt: days(20) },
        { _id: 'task-2', eventId: 'event-1', title: 'Done', status: 'completed', dueAt: days(-1) },
        { _id: 'task-3', eventId: 'event-2', title: 'Closed event', status: 'open', dueAt: days(-1) }
      ],
      events: [makeEvent(), makeEvent({ _id: 'event-2', status: 'completed' })],
      today
    });

    assert.equal(actions.length, 0);
  });

  test('asks to confirm an event that starts soon and is still unconfirmed', () => {
    const actions = eventConfirmationRule({
      events: [makeEvent({ startAt: days(5) })],
      today
    });

    assert.equal(actions.length, 1);
    assert.equal(actions[0].dedupeKey, 'event-confirm:event-1');
    assert.equal(actions[0].priority, 'high');
  });

  test('does not confirm events that are already confirmed or far away', () => {
    const actions = eventConfirmationRule({
      events: [
        makeEvent({ status: 'confirmed' }),
        makeEvent({ _id: 'event-2', startAt: days(60) })
      ],
      today
    });

    assert.equal(actions.length, 0);
  });

  test('suggests adding vendors when an event has none', () => {
    const actions = missingVendorRule({
      events: [makeEvent()],
      assignments: [],
      today
    });

    assert.equal(actions.length, 1);
    assert.equal(actions[0].dedupeKey, 'event-vendors:event-1');
  });

  test('does not suggest vendors when one is already assigned', () => {
    const actions = missingVendorRule({
      events: [makeEvent()],
      assignments: [{ _id: 'assignment-1', eventId: 'event-1', status: 'booked' }],
      today
    });

    assert.equal(actions.length, 0);
  });

  test('asks to confirm a vendor that is still considering close to the event', () => {
    const actions = vendorConfirmationRule({
      events: [makeEvent({ startAt: days(10) })],
      assignments: [{ _id: 'assignment-1', eventId: 'event-1', status: 'considering', vendorName: 'Royal Caterers' }],
      today
    });

    assert.equal(actions.length, 1);
    assert.equal(actions[0].dedupeKey, 'event-vendor:assignment-1');
    assert.match(actions[0].title, /Royal Caterers/);
  });

  test('ignores booked vendors and distant events', () => {
    const actions = vendorConfirmationRule({
      events: [makeEvent({ startAt: days(30) })],
      assignments: [{ _id: 'assignment-1', eventId: 'event-1', status: 'booked' }],
      today
    });

    assert.equal(actions.length, 0);
  });

  test('flags an overspent budget', () => {
    const actions = budgetRule({
      events: [makeEvent({ budget: { amount: 50000, spent: 60000, currency: 'INR' } })]
    });

    assert.equal(actions.length, 1);
    assert.equal(actions[0].dedupeKey, 'event-budget:event-1');
    assert.equal(actions[0].priority, 'high');
  });

  test('does not flag a budget that is exactly on target', () => {
    const actions = budgetRule({
      events: [makeEvent({ budget: { amount: 50000, spent: 50000, currency: 'INR' } })]
    });

    assert.equal(actions.length, 0);
  });

  test('suggests planning tasks when an event has no tasks', () => {
    const actions = missingTasksRule({ events: [makeEvent()], tasks: [], today });
    assert.equal(actions.length, 1);
    assert.equal(actions[0].dedupeKey, 'event-tasks:event-1');
  });

  test('does not suggest tasks when at least one task exists', () => {
    const actions = missingTasksRule({
      events: [makeEvent()],
      tasks: [{ _id: 'task-1', eventId: 'event-1', status: 'completed' }],
      today
    });
    assert.equal(actions.length, 0);
  });

  test('buildActions is deterministic and does not mutate its input', () => {
    const input = {
      events: [makeEvent({ budget: { amount: 1000, spent: 2000, currency: 'INR' } })],
      tasks: [{ _id: 'task-1', eventId: 'event-1', title: 'Book caterer', status: 'open', dueAt: days(-1) }],
      assignments: [{ _id: 'assignment-1', eventId: 'event-1', status: 'considering', vendorName: 'Royal Caterers' }],
      today
    };
    const snapshot = JSON.stringify(input);

    const first = buildActions(input);
    const second = buildActions(input);

    assert.deepEqual(first, second);
    assert.equal(JSON.stringify(input), snapshot);
    assert.ok(first.length >= 3);
    assert.equal(new Set(first.map((action) => action.dedupeKey)).size, first.length);
  });

  test('a completed event produces no actions', () => {
    const actions = buildActions({
      events: [makeEvent({ status: 'completed', budget: { amount: 1000, spent: 2000, currency: 'INR' } })],
      tasks: [],
      assignments: [],
      today
    });

    assert.equal(actions.length, 0);
  });
});
