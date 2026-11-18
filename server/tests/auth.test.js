import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';

const validPlanner = {
  name: 'Asha Planner',
  email: 'asha@example.com',
  password: 'password123',
  businessName: 'Asha Events'
};

describe('health', () => {
  test('reports the API is reachable', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});

describe('auth', () => {
  before(startDb);
  after(stopDb);
  beforeEach(clearDb);

  test('registers a planner and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(validPlanner);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, validPlanner.email);
    assert.equal(res.body.data.user.password, undefined);
  });

  test('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validPlanner, email: 'not-an-email' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /valid email/i);
  });

  test('rejects a short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validPlanner, email: 'short@example.com', password: '1234567' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /at least 8/i);
  });

  test('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validPlanner);
    const res = await request(app).post('/api/auth/register').send(validPlanner);
    assert.equal(res.status, 409);
  });

  test('logs in with the correct password', async () => {
    await request(app).post('/api/auth/register').send(validPlanner);
    const res = await request(app).post('/api/auth/login').send({
      email: validPlanner.email,
      password: validPlanner.password
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.token);
  });

  test('rejects a wrong password', async () => {
    await request(app).post('/api/auth/register').send(validPlanner);
    const res = await request(app).post('/api/auth/login').send({
      email: validPlanner.email,
      password: 'wrong-password'
    });
    assert.equal(res.status, 401);
  });

  test('rejects a request without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});
