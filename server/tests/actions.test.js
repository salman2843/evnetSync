import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import Client from '../src/models/Client.js';
import Event from '../src/models/Event.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';
import { createPlanner } from './helpers/planner.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (count) => new Date(Date.now() + count * DAY);

describe('action center', () => {
  let token;
  let userId;
  let event;

  before(startDb);
  after(stopDb);
  beforeEach(async () => {
    await clearDb();
    const planner = await createPlanner();
    token = planner.token;
    userId = planner.user._id;

    const client = await Client.create({ userId, name: 'Ravi Kumar', phone: '+919876543210' });
    event = await Event.create({
      userId,
      clientId: client._id,
      title: 'Ravi Wedding',
      eventTypeId: 'wedding',
      status: 'planning',
      startAt: daysFromNow(10)
    });
  });

  const regenerate = () => request(app).post('/api/actions/regenerate').set(auth(token));
  const list = (query = '') => request(app).get(`/api/actions${query}`).set(auth(token));

  test('regenerates actions from events with no tasks or vendors', async () => {
    const res = await regenerate();

    assert.equal(res.status, 200);
    assert.equal(res.body.data.created, 3);
    assert.equal(res.body.data.total, 3);

    const actions = await list();
    assert.equal(actions.body.data.actions.length, 3);
    assert.ok(actions.body.data.actions.every((action) => action.source === 'rule'));
  });

  test('regeneration is idempotent', async () => {
    await regenerate();
    const second = await regenerate();

    assert.equal(second.body.data.created, 0);
    assert.equal(second.body.data.total, 3);

    const actions = await list();
    assert.equal(actions.body.data.actions.length, 3);
  });

  test('creates an overdue task action and removes the empty-task-list action', async () => {
    await regenerate();
    const task = await request(app)
      .post(`/api/events/${event._id}/tasks`)
      .set(auth(token))
      .send({ title: 'Book caterer', dueAt: daysFromNow(-1).toISOString() });

    const res = await regenerate();
    assert.equal(res.body.data.created, 1);
    assert.equal(res.body.data.removed, 1);
    assert.equal(res.body.data.total, 3);

    const actions = await list();
    const titles = actions.body.data.actions.map((action) => action.title);
    assert.ok(titles.some((title) => /Overdue task: Book caterer/.test(title)));
    assert.ok(!titles.some((title) => /Plan tasks/.test(title)));
    const overdue = actions.body.data.actions.find((action) => action.title.includes('Overdue'));
    assert.equal(overdue.isOverdue, true);
    assert.equal(overdue.priority, 'high');
    assert.ok(task.body.data.task._id);
  });

  test('removes the task action when the task is completed', async () => {
    const task = await request(app)
      .post(`/api/events/${event._id}/tasks`)
      .set(auth(token))
      .send({ title: 'Book caterer', dueAt: daysFromNow(-1).toISOString() });
    await regenerate();

    await request(app)
      .put(`/api/events/${event._id}/tasks/${task.body.data.task._id}`)
      .set(auth(token))
      .send({ status: 'completed' });

    const res = await regenerate();
    assert.equal(res.body.data.removed, 1);
    assert.equal(res.body.data.total, 2);

    const actions = await list();
    assert.ok(!actions.body.data.actions.some((action) => action.dedupeKey.startsWith('task:')));
  });

  test('creates a manual action and keeps it through regeneration', async () => {
    const created = await request(app)
      .post('/api/actions')
      .set(auth(token))
      .send({ title: 'Call the florist', priority: 'high', dueAt: daysFromNow(1).toISOString() });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.action.source, 'manual');

    await regenerate();
    const actions = await list();
    const manual = actions.body.data.actions.find((action) => action.source === 'manual');
    assert.equal(manual.title, 'Call the florist');
  });

  test('marks an action done and keeps it done after regeneration', async () => {
    const created = await request(app)
      .post('/api/actions')
      .set(auth(token))
      .send({ title: 'Call the florist' });

    const done = await request(app)
      .patch(`/api/actions/${created.body.data.action._id}`)
      .set(auth(token))
      .send({ status: 'done' });

    assert.equal(done.status, 200);
    assert.ok(done.body.data.action.completedAt);

    await regenerate();
    const doneList = await list('?status=done');
    assert.equal(doneList.body.data.actions.length, 1);
    assert.equal(doneList.body.data.actions[0].status, 'done');
  });

  test('filters actions by status, event, and due date', async () => {
    await regenerate();
    await request(app)
      .post('/api/actions')
      .set(auth(token))
      .send({ title: 'Late manual action', dueAt: daysFromNow(-2).toISOString() });

    const open = await list();
    assert.ok(open.body.data.actions.length >= 3);

    const overdue = await list('?due=overdue');
    assert.ok(overdue.body.data.actions.length >= 1);
    assert.ok(overdue.body.data.actions.every((action) => action.isOverdue));

    const forEvent = await list(`?eventId=${event._id}`);
    assert.ok(forEvent.body.data.actions.length >= 3);
    assert.ok(forEvent.body.data.actions.every((action) => String(action.eventId._id) === String(event._id)));

    const invalidStatus = await list('?status=unknown');
    assert.equal(invalidStatus.status, 400);
  });

  test('rejects an action linked to another planner event', async () => {
    const other = await createPlanner();
    const res = await request(app)
      .post('/api/actions')
      .set(auth(other.token))
      .send({ title: 'Wrong event', eventId: event._id });

    assert.equal(res.status, 404);
  });

  test('does not expose actions to another planner', async () => {
    await regenerate();
    const actions = await list();
    const actionId = actions.body.data.actions[0]._id;
    const other = await createPlanner();

    const patch = await request(app)
      .patch(`/api/actions/${actionId}`)
      .set(auth(other.token))
      .send({ status: 'done' });

    assert.equal(patch.status, 404);
  });

  test('regenerating for another planner changes nothing', async () => {
    await regenerate();
    const other = await createPlanner();

    const res = await request(app).post('/api/actions/regenerate').set(auth(other.token));
    assert.equal(res.body.data.total, 0);

    const actions = await list();
    assert.equal(actions.body.data.actions.length, 3);
  });

  test('rejects an invalid action id', async () => {
    const res = await request(app)
      .patch('/api/actions/not-an-id')
      .set(auth(token))
      .send({ status: 'done' });

    assert.equal(res.status, 400);
  });
});
