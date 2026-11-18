import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';
import { createPlanner } from './helpers/planner.js';
import { toAbsolutePath, uploadRoot } from '../src/services/storageService.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// A real 1x1 transparent PNG, used to test signature detection.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

describe('profile and media', () => {
  let planner;
  let token;

  before(startDb);
  after(async () => {
    await fs.rm(uploadRoot(), { recursive: true, force: true });
    await stopDb();
  });
  beforeEach(async () => {
    await clearDb();
    planner = await createPlanner();
    token = planner.token;
  });

  test('updates the planner name and business details', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set(auth(token))
      .send({
        name: 'Asha Rao',
        businessName: 'Asha Events Co',
        timeZone: 'Asia/Kolkata',
        currency: 'INR'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.name, 'Asha Rao');
    assert.equal(res.body.data.user.plannerProfile.timeZone, 'Asia/Kolkata');
    assert.equal(res.body.data.user.plannerProfile.currency, 'INR');

    const me = await request(app).get('/api/auth/me').set(auth(token));
    assert.equal(me.body.data.user.businessName, 'Asha Events Co');
  });

  test('rejects an invalid time zone', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set(auth(token))
      .send({ timeZone: 'Mars/Olympus' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /time zone/i);
  });

  test('rejects an empty profile update', async () => {
    const res = await request(app).patch('/api/profile').set(auth(token)).send({});
    assert.equal(res.status, 400);
    assert.match(res.body.message, /at least one field/i);
  });

  test('rejects a wrong current password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set(auth(token))
      .send({ currentPassword: 'wrong-password', newPassword: 'newpassword123' });

    assert.equal(res.status, 401);
  });

  test('rejects a short new password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set(auth(token))
      .send({ currentPassword: 'password123', newPassword: '1234567' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /at least 8/i);
  });

  test('changes the password and invalidates older tokens', async () => {
    // A token signed one hour ago; it must work before the change and fail after.
    const backdated = jwt.sign(
      { id: planner.user._id, iat: Math.floor(Date.now() / 1000) - 3600 },
      process.env.JWT_SECRET
    );
    const before = await request(app).get('/api/auth/me').set(auth(backdated));
    assert.equal(before.status, 200);

    const res = await request(app)
      .put('/api/profile/password')
      .set(auth(token))
      .send({ currentPassword: 'password123', newPassword: 'newpassword123' });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.token);

    const old = await request(app).get('/api/auth/me').set(auth(backdated));
    assert.equal(old.status, 401);

    const fresh = await request(app).get('/api/auth/me').set(auth(res.body.data.token));
    assert.equal(fresh.status, 200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: planner.user.email, password: 'newpassword123' });
    assert.equal(login.status, 200);
  });

  test('uploads a business logo and serves the file', async () => {
    const res = await request(app)
      .post('/api/profile/logo')
      .set(auth(token))
      .attach('logo', PNG, { filename: 'logo.png', contentType: 'image/png' });

    assert.equal(res.status, 201);
    const logo = res.body.data.user.businessLogo;
    assert.match(logo.url, /^\/uploads\/logos\/.+\.png$/);
    await fs.access(toAbsolutePath(logo.url));

    const served = await request(app).get(logo.url);
    assert.equal(served.status, 200);

    const me = await request(app).get('/api/auth/me').set(auth(token));
    assert.equal(me.body.data.user.businessLogo.url, logo.url);
  });

  test('replacing a logo deletes the old file', async () => {
    const first = await request(app)
      .post('/api/profile/logo')
      .set(auth(token))
      .attach('logo', PNG, { filename: 'first.png', contentType: 'image/png' });
    const firstUrl = first.body.data.user.businessLogo.url;

    const second = await request(app)
      .post('/api/profile/logo')
      .set(auth(token))
      .attach('logo', PNG, { filename: 'second.png', contentType: 'image/png' });
    const secondUrl = second.body.data.user.businessLogo.url;

    assert.notEqual(firstUrl, secondUrl);
    await assert.rejects(fs.access(toAbsolutePath(firstUrl)));
    await fs.access(toAbsolutePath(secondUrl));
  });

  test('rejects a text file pretending to be a PNG', async () => {
    const res = await request(app)
      .post('/api/profile/logo')
      .set(auth(token))
      .attach('logo', Buffer.from('this is not an image'), { filename: 'fake.png', contentType: 'image/png' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /valid PNG/i);
  });

  test('rejects SVG uploads', async () => {
    const res = await request(app)
      .post('/api/profile/logo')
      .set(auth(token))
      .attach('logo', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), {
        filename: 'logo.svg',
        contentType: 'image/svg+xml'
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /PNG, JPEG, or WebP/i);
  });

  test('deletes the logo and its file', async () => {
    const uploaded = await request(app)
      .post('/api/profile/logo')
      .set(auth(token))
      .attach('logo', PNG, { filename: 'logo.png', contentType: 'image/png' });
    const url = uploaded.body.data.user.businessLogo.url;

    const res = await request(app).delete('/api/profile/logo').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.businessLogo, null);
    await assert.rejects(fs.access(toAbsolutePath(url)));
  });

  test('returns the event type catalog', async () => {
    const res = await request(app).get('/api/meta/event-types').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.groups.length, 3);
    assert.ok(res.body.data.festivalSubtypes.some((subtype) => subtype.id === 'diwali'));
  });
});
