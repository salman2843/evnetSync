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
});
