import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import Client from '../src/models/Client.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';
import { createPlanner } from './helpers/planner.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

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
        startAt: '2026-11-08T10:00:00.000Z'
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
});
