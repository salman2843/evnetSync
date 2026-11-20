import './helpers/testEnv.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import ActionItem from '../src/models/ActionItem.js';
import Client from '../src/models/Client.js';
import Event from '../src/models/Event.js';
import Task from '../src/models/Task.js';
import Vendor from '../src/models/Vendor.js';
import { toCsv } from '../src/services/csvService.js';
import { clearDb, startDb, stopDb } from './helpers/db.js';
import { createPlanner } from './helpers/planner.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (count) => new Date(Date.now() + count * DAY);

describe('csv formatting', () => {
  test('escapes commas, quotes, and line breaks', () => {
    const csv = toCsv(
      [
        { name: 'Ravi, Kumar', note: 'Said "yes"', empty: null },
        { name: 'Plain', note: 'Line one\nLine two', empty: '' }
      ],
      [
        { label: 'Name', value: (row) => row.name },
        { label: 'Note', value: (row) => row.note },
        { label: 'Empty', value: (row) => row.empty }
      ]
    );

    assert.equal(
      csv,
      'Name,Note,Empty\r\n' +
        '"Ravi, Kumar","Said ""yes""",\r\n' +
        'Plain,"Line one\nLine two",\r\n'
    );
  });
});

describe('extras: duplicate, exports, search', () => {
  let token;
  let userId;
  let client;
  let event;
  let vendor;

  before(startDb);
  after(stopDb);
  beforeEach(async () => {
    await clearDb();
    const planner = await createPlanner();
    token = planner.token;
    userId = planner.user._id;

    client = await Client.create({ userId, name: 'Ravi Kumar', phone: '+919876543210', email: 'ravi@example.com' });
    event = await Event.create({
      userId,
      clientId: client._id,
      title: 'Ravi Wedding',
      eventTypeId: 'wedding',
      status: 'confirmed',
      startAt: daysFromNow(10),
      budget: { amount: 50000, spent: 20000, currency: 'INR' },
      notes: 'Beach side venue'
    });
    await Task.create({
      userId,
      eventId: event._id,
      title: 'Book caterer',
      dueAt: daysFromNow(5),
      status: 'completed'
    });

    const vendorRes = await request(app)
      .post('/api/vendors')
      .set(auth(token))
      .send({ name: 'Royal Caterers', serviceCategoryIds: ['catering'], phone: '+919876543211' });
    vendor = vendorRes.body.data.vendor;

    await ActionItem.create({
      userId,
      dedupeKey: 'manual:florist',
      title: 'Call florist',
      status: 'open',
      dueAt: daysFromNow(1)
    });
  });

  describe('duplicate event', () => {
    const duplicate = (body = {}) =>
      request(app).post(`/api/events/${event._id}/duplicate`).set(auth(token)).send(body);

    test('copies the event with a fresh status and resets spent budget', async () => {
      const res = await duplicate();

      assert.equal(res.status, 201);
      assert.equal(res.body.data.event.title, 'Ravi Wedding (copy)');
      assert.equal(res.body.data.event.status, 'inquiry');
      assert.equal(res.body.data.event.budget.amount, 50000);
      assert.equal(res.body.data.event.budget.spent, 0);
      assert.equal(res.body.data.event.clientId.name, 'Ravi Kumar');
      assert.equal(res.body.data.copiedTasks, 1);
    });

    test('shifts task due dates by the change in event date and reopens them', async () => {
      const newStart = daysFromNow(40);
      const res = await duplicate({ title: 'Ravi Wedding Next Year', startAt: newStart.toISOString() });

      assert.equal(res.body.data.event.title, 'Ravi Wedding Next Year');
      const copiedEventId = res.body.data.event._id;

      const detail = await request(app).get(`/api/events/${copiedEventId}`).set(auth(token));
      assert.equal(detail.body.data.tasks.length, 1);
      assert.equal(detail.body.data.tasks[0].status, 'open');
      // The original task was 5 days out; the event moved 30 days, so the copy
      // is due 35 days out.
      const dueAt = new Date(detail.body.data.tasks[0].dueAt).getTime();
      const expected = daysFromNow(35).getTime();
      assert.ok(Math.abs(dueAt - expected) < 2000);
    });

    test('does not duplicate another planner event', async () => {
      const other = await createPlanner();
      const res = await request(app)
        .post(`/api/events/${event._id}/duplicate`)
        .set(auth(other.token));

      assert.equal(res.status, 404);
    });

    test('rejects an invalid event id', async () => {
      const res = await request(app).post('/api/events/not-an-id/duplicate').set(auth(token));
      assert.equal(res.status, 400);
    });
  });

  describe('csv exports', () => {
    const download = (path) => request(app).get(path).set(auth(token));

    test('exports clients as a downloadable CSV', async () => {
      const res = await download('/api/exports/clients.csv');

      assert.equal(res.status, 200);
      assert.match(res.headers['content-type'], /text\/csv/);
      assert.match(res.headers['content-disposition'], /attachment; filename="clients-\d{4}-\d{2}-\d{2}\.csv"/);
      assert.match(res.text, /Name,Company,Phone,Email,Preferred contact,Source,Status,Address,Notes,Created/);
      assert.match(res.text, /Ravi Kumar,,(?:\+919876543210|"\+919876543210"),ravi@example\.com,WhatsApp,,New/);
    });

    test('exports events with client and budget columns', async () => {
      const res = await download('/api/exports/events.csv');

      assert.equal(res.status, 200);
      assert.match(res.text, /Title,Client,Event type/);
      assert.match(res.text, /Ravi Wedding,Ravi Kumar,wedding,.*confirmed/);
      assert.match(res.text, /50000,20000,INR/);
    });

    test('exports vendors and actions', async () => {
      const vendors = await download('/api/exports/vendors.csv');
      const actions = await download('/api/exports/actions.csv');

      assert.equal(vendors.status, 200);
      assert.match(vendors.text, /Royal Caterers,catering/);
      assert.equal(actions.status, 200);
      assert.match(actions.text, /Call florist,open,normal,manual,manual/);
    });

    test('does not export another planner records', async () => {
      const other = await createPlanner();
      await Client.create({ userId: other.user._id, name: 'Other Person', phone: '+919876543299' });

      const res = await download('/api/exports/clients.csv');

      assert.match(res.text, /Ravi Kumar/);
      assert.doesNotMatch(res.text, /Other Person/);
    });

    test('requires authentication', async () => {
      for (const path of ['/api/exports/clients.csv', '/api/exports/events.csv', '/api/exports/vendors.csv', '/api/exports/actions.csv']) {
        const res = await request(app).get(path);
        assert.equal(res.status, 401);
      }
    });
  });

  describe('global search', () => {
    const search = (query) => request(app).get('/api/search').query({ q: query }).set(auth(token));

    test('finds clients and events by a case-insensitive name', async () => {
      const res = await search('rAvI');

      assert.equal(res.status, 200);
      assert.equal(res.body.data.total, 2);
      assert.equal(res.body.data.results.clients[0].title, 'Ravi Kumar');
      assert.equal(res.body.data.results.events[0].title, 'Ravi Wedding');
      assert.match(res.body.data.results.events[0].subtitle, /Ravi Kumar · confirmed/);
    });

    test('finds vendors and tasks by partial words', async () => {
      const res = await search('cater');

      assert.equal(res.status, 200);
      assert.equal(res.body.data.results.vendors[0].title, 'Royal Caterers');
      assert.equal(res.body.data.results.tasks[0].title, 'Book caterer');
    });

    test('finds manual actions', async () => {
      const res = await search('florist');

      assert.equal(res.status, 200);
      assert.equal(res.body.data.total, 1);
      assert.equal(res.body.data.results.actions[0].title, 'Call florist');
    });

    test('treats regular-expression characters as plain text', async () => {
      const res = await search('(');

      assert.equal(res.status, 200);
      assert.equal(res.body.data.total, 0);
    });

    test('returns only the logged-in planner records', async () => {
      const other = await createPlanner();
      await Client.create({ userId: other.user._id, name: 'Ravi Other', phone: '+919876543299' });

      const mine = await search('ravi');
      assert.equal(mine.body.data.results.clients.length, 1);
      assert.equal(mine.body.data.results.clients[0].title, 'Ravi Kumar');

      const theirs = await request(app).get('/api/search').query({ q: 'ravi' }).set(auth(other.token));
      assert.equal(theirs.body.data.results.clients.length, 1);
      assert.equal(theirs.body.data.results.clients[0].title, 'Ravi Other');
    });

    test('rejects an empty search term', async () => {
      const res = await request(app).get('/api/search').set(auth(token));
      assert.equal(res.status, 400);
      assert.match(res.body.message, /search term/i);
    });

    test('requires authentication', async () => {
      const res = await request(app).get('/api/search').query({ q: 'ravi' });
      assert.equal(res.status, 401);
    });
  });
});

describe('list pagination', () => {
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

  test('paginates clients and reports the total', async () => {
    for (let index = 1; index <= 5; index += 1) {
      await Client.create({ userId, name: `Client ${index}`, phone: `+9198765432${10 + index}` });
    }

    const res = await request(app).get('/api/clients?limit=2&page=2').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.clients.length, 2);
    assert.deepEqual(res.body.data.pagination, { page: 2, limit: 2, total: 6, pages: 3 });
  });

  test('paginates events while keeping task summaries', async () => {
    for (let index = 1; index <= 5; index += 1) {
      await Event.create({
        userId,
        clientId: client._id,
        title: `Event ${index}`,
        eventTypeId: 'wedding',
        startAt: daysFromNow(index)
      });
    }

    const res = await request(app).get('/api/events?limit=2&page=3').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.events.length, 1);
    // The default archive order is newest first, so the last page is Event 1.
    assert.equal(res.body.data.events[0].title, 'Event 1');
    assert.deepEqual(res.body.data.events[0].taskSummary, { total: 0, completed: 0 });
    assert.deepEqual(res.body.data.pagination, { page: 3, limit: 2, total: 5, pages: 3 });
  });

  test('paginates vendors', async () => {
    await Vendor.create([
      { userId, name: 'Alpha Caterers' },
      { userId, name: 'Beta Decor' },
      { userId, name: 'Gamma Studio' }
    ]);

    const res = await request(app).get('/api/vendors?limit=2&page=1').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.vendors.length, 2);
    assert.deepEqual(res.body.data.pagination, { page: 1, limit: 2, total: 3, pages: 2 });
  });

  test('returns every row when no pagination is requested', async () => {
    await Client.create([
      { userId, name: 'Client One', phone: '+919876543220' },
      { userId, name: 'Client Two', phone: '+919876543221' }
    ]);

    const res = await request(app).get('/api/clients').set(auth(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.clients.length, 3);
    assert.equal(res.body.data.pagination, undefined);
  });

  test('rejects invalid page and limit values', async () => {
    for (const query of ['?page=0', '?limit=0', '?limit=101', '?page=abc']) {
      const res = await request(app).get(`/api/clients${query}`).set(auth(token));
      assert.equal(res.status, 400, query);
    }
  });
});
