import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';
import { createPlanner } from './helpers/planner.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('clients', () => {
  let token;

  before(startDb);
  after(stopDb);
  beforeEach(async () => {
    await clearDb();
    ({ token } = await createPlanner());
  });

  test('creates a client without an email address', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '+919876543210' });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.client.name, 'Ravi Kumar');
    assert.equal(res.body.data.client.email, '');
  });

  test('normalizes a phone number with spaces and dashes', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '+91 98765-43210' });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.client.phone, '+919876543210');
  });

  test('rejects an invalid phone number', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '98765' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /phone/i);
  });

  test('rejects an invalid email when one is provided', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '+919876543210', email: 'bad-email' });

    assert.equal(res.status, 400);
  });

  test('blocks deleting a client that still has events', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '+919876543210' });
    const clientId = clientRes.body.data.client._id;

    await request(app)
      .post('/api/events')
      .set(auth(token))
      .send({
        clientId,
        title: 'Ravi Wedding',
        eventTypeId: 'wedding',
        startAt: '2026-12-01T10:00:00.000Z'
      });

    const deleteRes = await request(app).delete(`/api/clients/${clientId}`).set(auth(token));

    assert.equal(deleteRes.status, 409);
    assert.match(deleteRes.body.message, /has 1 event/i);
  });

  test('deletes a client with no events', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '+919876543210' });

    const deleteRes = await request(app)
      .delete(`/api/clients/${clientRes.body.data.client._id}`)
      .set(auth(token));

    assert.equal(deleteRes.status, 200);
  });

  test('saves company, source and preferred contact', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({
        name: 'Ravi Kumar',
        phone: '+919876543210',
        company: 'Kumar Weddings',
        source: 'Instagram',
        preferredContact: 'Phone call'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.client.company, 'Kumar Weddings');
    assert.equal(res.body.data.client.source, 'Instagram');
    assert.equal(res.body.data.client.preferredContact, 'Phone call');
  });

  test('defaults preferred contact to WhatsApp and leaves source blank', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '+919876543210' });

    assert.equal(res.body.data.client.preferredContact, 'WhatsApp');
    assert.equal(res.body.data.client.source, '');
  });

  test('rejects a lead source outside the list', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '+919876543210', source: 'Carrier pigeon' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /source/i);
  });

  test('updates only the status, as the client card does', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '+919876543210' });

    const res = await request(app)
      .put(`/api/clients/${clientRes.body.data.client._id}`)
      .set(auth(token))
      .send({ status: 'Booked' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.client.status, 'Booked');
    assert.equal(res.body.data.client.name, 'Ravi Kumar');
  });

  test('adds event count and the next upcoming event to the list', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set(auth(token))
      .send({ name: 'Ravi Kumar', phone: '+919876543210' });
    const clientId = clientRes.body.data.client._id;

    const day = 24 * 60 * 60 * 1000;
    const next = new Date(Date.now() + 30 * day).toISOString();
    const later = new Date(Date.now() + 90 * day).toISOString();

    await request(app).post('/api/events').set(auth(token)).send({
      clientId, title: 'Next one', eventTypeId: 'wedding', startAt: next
    });
    await request(app).post('/api/events').set(auth(token)).send({
      clientId, title: 'Cancelled one', eventTypeId: 'wedding', startAt: later, status: 'cancelled'
    });

    const res = await request(app).get('/api/clients').set(auth(token));

    assert.equal(res.status, 200);
    const client = res.body.data.clients.find((item) => item._id === clientId);
    assert.equal(client.eventCount, 2);
    assert.equal(new Date(client.nextEventAt).toISOString(), next);
  });

  test('sorts clients by name when asked', async () => {
    await request(app).post('/api/clients').set(auth(token)).send({ name: 'Zara Khan', phone: '+919000000001' });
    await request(app).post('/api/clients').set(auth(token)).send({ name: 'Aman Rao', phone: '+919000000002' });

    const res = await request(app).get('/api/clients?sort=name').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.clients[0].name, 'Aman Rao');
  });

  test('rejects an unknown sort value', async () => {
    const res = await request(app).get('/api/clients?sort=oldest').set(auth(token));

    assert.equal(res.status, 400);
    assert.match(res.body.message, /sort/i);
  });
});
