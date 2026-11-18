import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import ActionItem from '../src/models/ActionItem.js';
import Client from '../src/models/Client.js';
import Event from '../src/models/Event.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';
import { createPlanner } from './helpers/planner.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (count) => new Date(Date.now() + count * DAY);

// The service counts "today" in the server's local time zone, so tests use the
// same boundaries instead of fixed UTC strings.
function localDayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

describe('dashboard summary', () => {
  let token;
  let userId;
  let client;

  before(startDb);
  after(stopDb);
  beforeEach(async () => {
    await clearDb();
    const planner = await createPlanner();
    token = planner.token;
    userId = planner.user._id;
    client = await Client.create({ userId, name: 'Ravi Kumar', phone: '+919876543210' });
  });

  const summary = (plannerToken = token) =>
    request(app).get('/api/dashboard/summary').set(auth(plannerToken));

  const createEvent = (overrides = {}) =>
    Event.create({
      userId,
      clientId: client._id,
      title: 'Ravi Wedding',
      eventTypeId: 'wedding',
      status: 'planning',
      startAt: daysFromNow(10),
      ...overrides
    });

  test('returns empty totals for a planner with no work', async () => {
    await Client.deleteMany({ userId });

    const res = await summary();

    assert.equal(res.status, 200);
    assert.equal(res.body.data.events.total, 0);
    assert.equal(res.body.data.events.upcoming, 0);
    assert.deepEqual(res.body.data.events.byStatus, {
      inquiry: 0,
      planning: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    });
    assert.deepEqual(res.body.data.events.next, []);
    assert.equal(res.body.data.actions.open, 0);
    assert.equal(res.body.data.actions.overdue, 0);
    assert.deepEqual(res.body.data.budget.byCurrency, []);
    assert.equal(res.body.data.clients.total, 0);
    assert.equal(res.body.data.vendors.total, 0);
    assert.equal(res.body.data.vendors.assignments.total, 0);
    assert.ok(res.body.data.generatedAt);
  });

  test('counts events by status and only lists active upcoming events', async () => {
    await createEvent({ status: 'confirmed', startAt: daysFromNow(-2) });
    await createEvent({ status: 'inquiry', startAt: daysFromNow(2) });
    await createEvent({ status: 'planning', startAt: daysFromNow(5) });
    await createEvent({ status: 'confirmed', startAt: daysFromNow(9) });
    await createEvent({ status: 'completed', startAt: daysFromNow(20) });
    await createEvent({ status: 'cancelled', startAt: daysFromNow(30) });

    const res = await summary();
    const data = res.body.data;

    assert.equal(data.events.total, 6);
    assert.deepEqual(data.events.byStatus, {
      inquiry: 1,
      planning: 1,
      confirmed: 2,
      completed: 1,
      cancelled: 1
    });
    // The past confirmed event is counted but is no longer upcoming, and
    // completed/cancelled events never appear in the upcoming list.
    assert.equal(data.events.upcoming, 3);
    assert.deepEqual(
      data.events.next.map((event) => event.status),
      ['inquiry', 'planning', 'confirmed']
    );
    assert.equal(data.events.next[0].client.name, 'Ravi Kumar');
  });

  test('limits the next events to five, nearest first', async () => {
    for (let day = 1; day <= 6; day += 1) {
      await createEvent({ title: `Event ${day}`, startAt: daysFromNow(day) });
    }

    const res = await summary();
    const next = res.body.data.events.next;

    assert.equal(res.body.data.events.upcoming, 6);
    assert.equal(next.length, 5);
    assert.deepEqual(
      next.map((event) => event.title),
      ['Event 1', 'Event 2', 'Event 3', 'Event 4', 'Event 5']
    );
  });

  test('counts open, overdue, due-today, done, and dismissed actions', async () => {
    const endOfToday = new Date(localDayStart().getTime() + DAY - 1000);

    await ActionItem.create([
      { userId, dedupeKey: 'manual:overdue', title: 'Overdue task', status: 'open', dueAt: daysFromNow(-2) },
      { userId, dedupeKey: 'manual:today', title: 'Due today', status: 'open', dueAt: endOfToday },
      { userId, dedupeKey: 'manual:future', title: 'Due later', status: 'open', dueAt: daysFromNow(10) },
      { userId, dedupeKey: 'manual:done', title: 'Finished', status: 'done', completedAt: new Date() },
      { userId, dedupeKey: 'manual:dismissed', title: 'Skipped', status: 'dismissed' }
    ]);

    const res = await summary();
    const actions = res.body.data.actions;

    assert.equal(actions.open, 3);
    assert.equal(actions.overdue, 1);
    assert.equal(actions.dueToday, 1);
    assert.equal(actions.done, 1);
    assert.equal(actions.dismissed, 1);
    assert.equal(actions.next.length, 3);
    assert.equal(actions.next[0].title, 'Overdue task');
    assert.equal(actions.next[0].isOverdue, true);
  });

  test('groups budget totals by currency and skips cancelled events', async () => {
    await createEvent({
      status: 'planning',
      budget: { amount: 50000, spent: 60000, currency: 'INR' }
    });
    await createEvent({
      status: 'completed',
      startAt: daysFromNow(-10),
      budget: { amount: 1000, spent: 200, currency: 'USD' }
    });
    await createEvent({
      status: 'cancelled',
      budget: { amount: 99999, spent: 5, currency: 'INR' }
    });

    const res = await summary();
    const budgets = res.body.data.budget.byCurrency;

    assert.equal(budgets.length, 2);
    assert.deepEqual(budgets[0], { currency: 'INR', planned: 50000, spent: 60000, remaining: -10000, events: 1 });
    assert.deepEqual(budgets[1], { currency: 'USD', planned: 1000, spent: 200, remaining: 800, events: 1 });
  });

  test('summarizes vendors and their assignment statuses', async () => {
    const event = await createEvent();

    const vendorIds = [];
    for (const name of ['Royal Caterers', 'Bloom Decor', 'Snap Studio']) {
      const res = await request(app)
        .post('/api/vendors')
        .set(auth(token))
        .send({ name, serviceCategoryIds: ['catering'] });
      vendorIds.push(res.body.data.vendor._id);
    }

    await request(app)
      .post(`/api/events/${event._id}/vendors`)
      .set(auth(token))
      .send({ vendorId: vendorIds[0], status: 'booked' });
    await request(app)
      .post(`/api/events/${event._id}/vendors`)
      .set(auth(token))
      .send({ vendorId: vendorIds[1], status: 'considering' });

    const res = await summary();
    const vendors = res.body.data.vendors;

    assert.equal(vendors.total, 3);
    assert.equal(vendors.assignments.total, 2);
    assert.equal(vendors.assignments.booked, 1);
    assert.equal(vendors.assignments.considering, 1);
    assert.equal(vendors.assignments.contacted, 0);
    assert.equal(vendors.assignments.declined, 0);
  });

  test('does not mix another planner data into the summary', async () => {
    await createEvent({ budget: { amount: 5000, spent: 1000, currency: 'INR' } });
    await ActionItem.create({ userId, dedupeKey: 'manual:mine', title: 'Mine', status: 'open' });

    const other = await createPlanner();
    const otherClient = await Client.create({ userId: other.user._id, name: 'Other Client', phone: '+919876543211' });
    await Event.create({
      userId: other.user._id,
      clientId: otherClient._id,
      title: 'Other Event',
      eventTypeId: 'wedding',
      startAt: daysFromNow(3)
    });
    await ActionItem.create({ userId: other.user._id, dedupeKey: 'manual:theirs', title: 'Theirs', status: 'open' });

    const res = await summary();
    const data = res.body.data;

    assert.equal(data.events.total, 1);
    assert.equal(data.clients.total, 1);
    assert.equal(data.actions.open, 1);
    assert.equal(data.events.next[0].title, 'Ravi Wedding');

    const otherRes = await summary(other.token);
    assert.equal(otherRes.body.data.events.total, 1);
    assert.equal(otherRes.body.data.events.next[0].title, 'Other Event');
    assert.equal(otherRes.body.data.actions.open, 1);
  });

  test('requires a logged-in planner', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    assert.equal(res.status, 401);
  });
});
