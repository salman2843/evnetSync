import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import Client from '../src/models/Client.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';
import { createPlanner } from './helpers/planner.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = (days) => new Date(Date.now() + days * DAY_MS).toISOString();
const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

describe('events and tasks', () => {
  let token;
  let userId;
  let clientId;

  before(startDb);
  after(stopDb);
  beforeEach(async () => {
    await clearDb();
    const planner = await createPlanner();
    token = planner.token;
    userId = planner.user._id;
    const client = await Client.create({ userId, name: 'Ravi Kumar', phone: '+919876543210' });
    clientId = client._id;
  });

  async function createFestivalEvent() {
    const res = await request(app)
      .post('/api/events')
      .set(auth(token))
      .send({
        clientId,
        title: 'Diwali Celebration',
        eventTypeId: 'festival',
        startAt: '2026-11-08T10:00:00.000Z',
        // Task tests build their own list; skip the suggested checklist.
        generateTasks: false
      });
    assert.equal(res.status, 201);
    return res.body.data.event;
  }

  test('updates the festival sub-type without resending the event type', async () => {
    const event = await createFestivalEvent();

    const res = await request(app)
      .put(`/api/events/${event._id}`)
      .set(auth(token))
      .send({ subEventTypeId: 'diwali' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.event.subEventTypeId, 'diwali');
  });

  test('rejects a festival sub-type on a non-festival event', async () => {
    const event = await createFestivalEvent();

    const res = await request(app)
      .put(`/api/events/${event._id}`)
      .set(auth(token))
      .send({ eventTypeId: 'wedding', subEventTypeId: 'diwali' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /festival/i);
  });

  test('clears the sub-type when the event stops being a festival', async () => {
    const event = await createFestivalEvent();

    const res = await request(app)
      .put(`/api/events/${event._id}`)
      .set(auth(token))
      .send({ eventTypeId: 'wedding' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.event.subEventTypeId, '');
  });

  test('keeps the existing budget when only one budget value is sent', async () => {
    const event = await createFestivalEvent();

    await request(app)
      .put(`/api/events/${event._id}`)
      .set(auth(token))
      .send({ budget: { amount: 50000, spent: 10000, currency: 'INR' } });

    const res = await request(app)
      .put(`/api/events/${event._id}`)
      .set(auth(token))
      .send({ budget: { spent: 25000 } });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.event.budget.amount, 50000);
    assert.equal(res.body.data.event.budget.spent, 25000);
  });

  test('returns tasks once, with undated tasks last', async () => {
    const event = await createFestivalEvent();
    const eventId = event._id;

    for (const body of [
      { title: 'No due date' },
      { title: 'Second', dueAt: '2026-11-02T10:00:00.000Z' },
      { title: 'First', dueAt: '2026-11-01T10:00:00.000Z' }
    ]) {
      const created = await request(app).post(`/api/events/${eventId}/tasks`).set(auth(token)).send(body);
      assert.equal(created.status, 201);
    }

    const res = await request(app).get(`/api/events/${eventId}`).set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.tasks.length, 3);
    assert.deepEqual(res.body.data.tasks.map((task) => task.title), ['First', 'Second', 'No due date']);
    // The event object should not repeat the task list.
    assert.equal(res.body.data.event.tasks, undefined);
  });

  test('updates a task priority and due date', async () => {
    const event = await createFestivalEvent();
    const created = await request(app)
      .post(`/api/events/${event._id}/tasks`)
      .set(auth(token))
      .send({ title: 'Book caterer' });

    const res = await request(app)
      .put(`/api/events/${event._id}/tasks/${created.body.data.task._id}`)
      .set(auth(token))
      .send({ priority: 'high', dueAt: '2026-11-05T10:00:00.000Z' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.task.priority, 'high');
    assert.ok(res.body.data.task.dueAt);
  });

  test('rejects an empty task update', async () => {
    const event = await createFestivalEvent();
    const created = await request(app)
      .post(`/api/events/${event._id}/tasks`)
      .set(auth(token))
      .send({ title: 'Book caterer' });

    const res = await request(app)
      .put(`/api/events/${event._id}/tasks/${created.body.data.task._id}`)
      .set(auth(token))
      .send({});

    assert.equal(res.status, 400);
    assert.match(res.body.message, /at least one field/i);
  });

  test('rejects invalid task ids with 400 instead of a crash', async () => {
    const res = await request(app)
      .put('/api/events/not-an-id/tasks/also-not-an-id')
      .set(auth(token))
      .send({ status: 'completed' });

    assert.equal(res.status, 400);
  });

  test('filters the event list by client', async () => {
    await createFestivalEvent();

    const otherClient = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Neha Shah', phone: '+919000000003' });
    const otherClientId = otherClient.body.data.client._id;

    await request(app).post('/api/events').set(auth(token)).send({
      clientId: otherClientId,
      title: 'Neha Reception',
      eventTypeId: 'wedding',
      startAt: '2027-02-14T10:00:00.000Z'
    });

    const res = await request(app)
      .get(`/api/events?clientId=${otherClientId}`)
      .set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.events.length, 1);
    assert.equal(res.body.data.events[0].title, 'Neha Reception');
  });

  test('does not return another planner\'s events for a client filter', async () => {
    const other = await createPlanner();
    const otherClient = await Client.create({
      userId: other.user._id,
      name: 'Private Client',
      phone: '+919000000004'
    });
    await request(app)
      .post('/api/events')
      .set(auth(other.token))
      .send({
        clientId: otherClient._id,
        title: 'Private Event',
        eventTypeId: 'wedding',
        startAt: '2027-05-01T10:00:00.000Z'
      });

    const res = await request(app)
      .get(`/api/events?clientId=${otherClient._id}`)
      .set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.events.length, 0);
  });

  test('rejects a malformed client filter id', async () => {
    const res = await request(app).get('/api/events?clientId=not-an-id').set(auth(token));

    assert.equal(res.status, 400);
    assert.match(res.body.message, /client id/i);
  });

  test('saves an optional venue and trims both lines', async () => {
    const res = await request(app)
      .post('/api/events')
      .set(auth(token))
      .send({
        clientId,
        title: 'Venue Test',
        eventTypeId: 'wedding',
        startAt: daysFromNow(30),
        generateTasks: false,
        venue: { name: '  Grand Hall  ', address: '  12 MG Road, Pune  ' }
      });

    assert.equal(res.status, 201);
    assert.deepEqual(res.body.data.event.venue, {
      name: 'Grand Hall',
      address: '12 MG Road, Pune'
    });
  });

  test('rejects a venue that is not an object', async () => {
    const res = await request(app)
      .post('/api/events')
      .set(auth(token))
      .send({
        clientId,
        title: 'Bad Venue',
        eventTypeId: 'wedding',
        startAt: daysFromNow(30),
        generateTasks: false,
        venue: 'Grand Hall'
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /venue/i);
  });

  test('creates the suggested checklist for a new event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set(auth(token))
      .send({
        clientId,
        title: 'A wedding in five days',
        eventTypeId: 'wedding',
        startAt: daysFromNow(5)
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.tasks.length, 7);
    assert.ok(res.body.data.tasks.every((task) => String(task.eventId) === res.body.data.event._id));
    // A short runway never creates tasks that are already overdue.
    assert.ok(
      res.body.data.tasks.every((task) => new Date(task.dueAt).getTime() >= startOfToday().getTime())
    );

    const detail = await request(app)
      .get(`/api/events/${res.body.data.event._id}`)
      .set(auth(token));
    assert.equal(detail.body.data.tasks.length, 7);
  });

  test('skips the suggested checklist when the planner opts out', async () => {
    const res = await request(app)
      .post('/api/events')
      .set(auth(token))
      .send({
        clientId,
        title: 'A quiet dinner',
        eventTypeId: 'engagement_party',
        startAt: daysFromNow(20),
        generateTasks: false
      });

    assert.equal(res.status, 201);
    assert.deepEqual(res.body.data.tasks, []);
  });

  test('does not add suggested tasks again when the event is edited', async () => {
    const created = await request(app)
      .post('/api/events')
      .set(auth(token))
      .send({
        clientId,
        title: 'Conference with tasks',
        eventTypeId: 'conference',
        startAt: daysFromNow(40)
      });
    const eventId = created.body.data.event._id;
    const count = created.body.data.tasks.length;
    assert.ok(count > 0);

    await request(app).put(`/api/events/${eventId}`).set(auth(token)).send({ title: 'Renamed' });

    const detail = await request(app).get(`/api/events/${eventId}`).set(auth(token));
    assert.equal(detail.body.data.tasks.length, count);
  });

  test('searches events by title and by client name', async () => {
    await createFestivalEvent();

    const otherClient = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Neha Shah', phone: '+919000000005' });
    await request(app)
      .post('/api/events')
      .set(auth(token))
      .send({
        clientId: otherClient.body.data.client._id,
        title: 'Reception Dinner',
        eventTypeId: 'wedding',
        startAt: daysFromNow(45),
        generateTasks: false
      });

    const byTitle = await request(app).get('/api/events?search=diwali').set(auth(token));
    assert.equal(byTitle.status, 200);
    assert.deepEqual(byTitle.body.data.events.map((event) => event.title), ['Diwali Celebration']);

    const byClient = await request(app).get('/api/events?search=shah').set(auth(token));
    assert.equal(byClient.status, 200);
    assert.deepEqual(byClient.body.data.events.map((event) => event.title), ['Reception Dinner']);
  });

  test('splits the list into upcoming and past events', async () => {
    for (const [title, days] of [['Future Gala', 10], ['Old Gala', -10]]) {
      const res = await request(app)
        .post('/api/events')
        .set(auth(token))
        .send({
          clientId,
          title,
          eventTypeId: 'community_fundraiser',
          startAt: daysFromNow(days),
          generateTasks: false
        });
      assert.equal(res.status, 201);
    }

    const upcoming = await request(app).get('/api/events?scope=upcoming').set(auth(token));
    assert.equal(upcoming.status, 200);
    assert.deepEqual(upcoming.body.data.events.map((event) => event.title), ['Future Gala']);

    const past = await request(app).get('/api/events?scope=past').set(auth(token));
    assert.equal(past.status, 200);
    assert.deepEqual(past.body.data.events.map((event) => event.title), ['Old Gala']);
  });

  test('adds the suggested checklist later without duplicating it', async () => {
    const created = await request(app)
      .post('/api/events')
      .set(auth(token))
      .send({
        clientId,
        title: 'Engagement with a late checklist',
        eventTypeId: 'engagement_party',
        startAt: daysFromNow(50),
        generateTasks: false
      });
    const eventId = created.body.data.event._id;
    assert.deepEqual(created.body.data.tasks, []);

    const first = await request(app)
      .post(`/api/events/${eventId}/tasks/suggested`)
      .set(auth(token));
    assert.equal(first.status, 201);
    assert.equal(first.body.data.tasks.length, 6);

    // Running it again adds nothing.
    const second = await request(app)
      .post(`/api/events/${eventId}/tasks/suggested`)
      .set(auth(token));
    assert.equal(second.status, 201);
    assert.equal(second.body.data.tasks.length, 0);

    // A deleted step can be restored by asking for the checklist again.
    await request(app)
      .delete(`/api/events/${eventId}/tasks/${first.body.data.tasks[0]._id}`)
      .set(auth(token));
    const restored = await request(app)
      .post(`/api/events/${eventId}/tasks/suggested`)
      .set(auth(token));
    assert.equal(restored.status, 201);
    assert.equal(restored.body.data.tasks.length, 1);

    const detail = await request(app).get(`/api/events/${eventId}`).set(auth(token));
    assert.equal(detail.body.data.tasks.length, 6);
  });

  test('rejects an invalid scope filter', async () => {
    const res = await request(app).get('/api/events?scope=soon').set(auth(token));

    assert.equal(res.status, 400);
    assert.match(res.body.message, /scope/i);
  });
});
