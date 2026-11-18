import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';
import { createPlanner } from './helpers/planner.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('vendors', () => {
  let token;

  before(startDb);
  after(stopDb);
  beforeEach(async () => {
    await clearDb();
    ({ token } = await createPlanner());
  });

  test('creates a vendor with only a name', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers' });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.vendor.name, 'Royal Caterers');
    assert.deepEqual(res.body.data.vendor.serviceCategoryIds, []);
    assert.equal(res.body.data.vendor.phone, '');
  });

  test('normalizes phone, email, and service categories', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({
        name: '  Pixel Studio  ',
        phone: '+91 98765-43210',
        email: '  HELLO@PIXEL.EXAMPLE  ',
        serviceCategoryIds: ['photography', 'photography', 'videography']
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.vendor.name, 'Pixel Studio');
    assert.equal(res.body.data.vendor.phone, '+919876543210');
    assert.equal(res.body.data.vendor.email, 'hello@pixel.example');
    assert.deepEqual(res.body.data.vendor.serviceCategoryIds, ['photography', 'videography']);
  });

  test('rejects an unknown service category', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers', serviceCategoryIds: ['catering', 'space_travel'] });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Unknown service category/i);
  });

  test('rejects an invalid phone number', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers', phone: '12345' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /phone/i);
  });

  test('rejects a website without http or https', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers', website: 'royalcaterers.com' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /website/i);
  });

  test('lists only the logged-in planner vendors', async () => {
    await request(app).post('/api/vendors').set(auth(token)).send({ name: 'Mine' });
    const other = await createPlanner();
    await request(app).post('/api/vendors').set(auth(other.token)).send({ name: 'Theirs' });

    const res = await request(app).get('/api/vendors').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.vendors.length, 1);
    assert.equal(res.body.data.vendors[0].name, 'Mine');
  });

  test('searches vendors by name', async () => {
    await request(app).post('/api/vendors').set(auth(token)).send({ name: 'Royal Caterers' });
    await request(app).post('/api/vendors').set(auth(token)).send({ name: 'Pixel Studio' });

    const res = await request(app).get('/api/vendors?search=royal').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.vendors.length, 1);
  });

  test('filters vendors by service category', async () => {
    await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Pixel Studio', serviceCategoryIds: ['photography'] });
    await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers', serviceCategoryIds: ['catering'] });

    const res = await request(app).get('/api/vendors?category=photography').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.vendors.length, 1);
    assert.equal(res.body.data.vendors[0].name, 'Pixel Studio');
  });

  test('rejects an invalid category filter', async () => {
    const res = await request(app).get('/api/vendors?category=space_travel').set(auth(token));
    assert.equal(res.status, 400);
  });

  test('updates a vendor', async () => {
    const created = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers' });

    const res = await request(app)
      .put(`/api/vendors/${created.body.data.vendor._id}`)
      .set(auth(token))
      .send({ name: 'Royal Caterers & Co', serviceCategoryIds: ['catering'] });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.vendor.name, 'Royal Caterers & Co');
    assert.deepEqual(res.body.data.vendor.serviceCategoryIds, ['catering']);
  });

  test('rejects an empty vendor update', async () => {
    const created = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers' });

    const res = await request(app)
      .put(`/api/vendors/${created.body.data.vendor._id}`)
      .set(auth(token))
      .send({});

    assert.equal(res.status, 400);
    assert.match(res.body.message, /at least one field/i);
  });

  test('deletes a vendor', async () => {
    const created = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers' });

    const res = await request(app)
      .delete(`/api/vendors/${created.body.data.vendor._id}`)
      .set(auth(token));

    assert.equal(res.status, 200);

    const missing = await request(app)
      .get(`/api/vendors/${created.body.data.vendor._id}`)
      .set(auth(token));
    assert.equal(missing.status, 404);
  });

  test('does not expose another planner vendor', async () => {
    const created = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers' });
    const other = await createPlanner();
    const vendorId = created.body.data.vendor._id;

    const get = await request(app).get(`/api/vendors/${vendorId}`).set(auth(other.token));
    const put = await request(app).put(`/api/vendors/${vendorId}`).set(auth(other.token)).send({ name: 'Hijacked' });
    const remove = await request(app).delete(`/api/vendors/${vendorId}`).set(auth(other.token));

    assert.equal(get.status, 404);
    assert.equal(put.status, 404);
    assert.equal(remove.status, 404);
  });

  test('rejects an invalid vendor id with 400', async () => {
    const res = await request(app).get('/api/vendors/not-an-id').set(auth(token));
    assert.equal(res.status, 400);
  });

  test('returns the vendor category catalog', async () => {
    const res = await request(app).get('/api/meta/vendor-categories').set(auth(token));

    assert.equal(res.status, 200);
    assert.ok(res.body.data.categories.length >= 10);
    assert.ok(res.body.data.categories.some((category) => category.id === 'catering'));
  });
});
