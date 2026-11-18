import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import Client from '../src/models/Client.js';
import Event from '../src/models/Event.js';
import EventVendor from '../src/models/EventVendor.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';
import { createPlanner } from './helpers/planner.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('event vendor assignments', () => {
  let token;
  let userId;
  let event;
  let vendor;

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
      startAt: new Date('2026-12-01T10:00:00.000Z')
    });

    const vendorRes = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers', serviceCategoryIds: ['catering'] });
    vendor = vendorRes.body.data.vendor;
  });

  const assign = (body = { vendorId: vendor._id }) =>
    request(app).post(`/api/events/${event._id}/vendors`).set(auth(token)).send(body);

  test('assigns a vendor and infers the service category', async () => {
    const res = await assign();

    assert.equal(res.status, 201);
    assert.equal(res.body.data.assignment.status, 'considering');
    assert.equal(res.body.data.assignment.serviceCategoryId, 'catering');
    assert.equal(res.body.data.assignment.vendorId.name, 'Royal Caterers');
  });

  test('rejects assigning the same vendor twice', async () => {
    await assign();
    const res = await assign();

    assert.equal(res.status, 409);
    assert.match(res.body.message, /already assigned/i);
  });

  test('rejects a vendor owned by another planner', async () => {
    const other = await createPlanner();
    const otherVendor = await request(app)
      .post('/api/vendors')
      .set(auth(other.token))
      .send({ name: 'Their Caterers' });

    const res = await assign({ vendorId: otherVendor.body.data.vendor._id });

    assert.equal(res.status, 404);
    assert.match(res.body.message, /Vendor not found/i);
  });

  test('lists the vendors assigned to an event', async () => {
    await assign();

    const res = await request(app).get(`/api/events/${event._id}/vendors`).set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.assignments.length, 1);
    assert.equal(res.body.data.assignments[0].vendorId.phone, '');
  });

  test('updates the assignment status, amount, and notes', async () => {
    const created = await assign();

    const res = await request(app)
      .put(`/api/events/${event._id}/vendors/${created.body.data.assignment._id}`)
      .set(auth(token))
      .send({ status: 'booked', agreedAmount: 45000, notes: 'Menu tasting on Friday' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.assignment.status, 'booked');
    assert.equal(res.body.data.assignment.agreedAmount, 45000);
    assert.equal(res.body.data.assignment.notes, 'Menu tasting on Friday');
  });

  test('rejects an invalid assignment status', async () => {
    const created = await assign();

    const res = await request(app)
      .put(`/api/events/${event._id}/vendors/${created.body.data.assignment._id}`)
      .set(auth(token))
      .send({ status: 'maybe' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /status/i);
  });

  test('rejects a negative agreed amount', async () => {
    const created = await assign();

    const res = await request(app)
      .put(`/api/events/${event._id}/vendors/${created.body.data.assignment._id}`)
      .set(auth(token))
      .send({ agreedAmount: -100 });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /amount/i);
  });

  test('rejects an empty assignment update', async () => {
    const created = await assign();

    const res = await request(app)
      .put(`/api/events/${event._id}/vendors/${created.body.data.assignment._id}`)
      .set(auth(token))
      .send({});

    assert.equal(res.status, 400);
  });

  test('removes a vendor from the event', async () => {
    const created = await assign();

    const res = await request(app)
      .delete(`/api/events/${event._id}/vendors/${created.body.data.assignment._id}`)
      .set(auth(token));

    assert.equal(res.status, 200);

    const list = await request(app).get(`/api/events/${event._id}/vendors`).set(auth(token));
    assert.equal(list.body.data.assignments.length, 0);
  });

  test('blocks deleting a vendor that is still assigned', async () => {
    await assign();

    const res = await request(app).delete(`/api/vendors/${vendor._id}`).set(auth(token));

    assert.equal(res.status, 409);
    assert.match(res.body.message, /assigned to 1 event/i);
  });

  test('deletes assignments when the event is deleted', async () => {
    await assign();

    const res = await request(app).delete(`/api/events/${event._id}`).set(auth(token));
    assert.equal(res.status, 200);

    const remaining = await EventVendor.countDocuments({ eventId: event._id });
    assert.equal(remaining, 0);
  });

  test('does not expose assignments to another planner', async () => {
    const created = await assign();
    const other = await createPlanner();
    const assignmentId = created.body.data.assignment._id;

    const list = await request(app).get(`/api/events/${event._id}/vendors`).set(auth(other.token));
    const update = await request(app)
      .put(`/api/events/${event._id}/vendors/${assignmentId}`)
      .set(auth(other.token))
      .send({ status: 'booked' });
    const remove = await request(app)
      .delete(`/api/events/${event._id}/vendors/${assignmentId}`)
      .set(auth(other.token));

    assert.equal(list.status, 404);
    assert.equal(update.status, 404);
    assert.equal(remove.status, 404);
  });

  test('rejects an invalid event id', async () => {
    const res = await request(app).get('/api/events/not-an-id/vendors').set(auth(token));
    assert.equal(res.status, 400);
  });
});
