// Local demo data: one planner, clients, vendors, events, tasks, assignments,
// and a freshly generated Action Center. Run with `npm run seed`.
//
// The planner email defaults to demo@eventsync.test. The password is taken from
// SEED_PASSWORD, or generated randomly and printed once. `--reset` deletes the
// demo planner's data and rebuilds it.
import '../src/config/env.js';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import ActionItem from '../src/models/ActionItem.js';
import Client from '../src/models/Client.js';
import Event from '../src/models/Event.js';
import EventVendor from '../src/models/EventVendor.js';
import Task from '../src/models/Task.js';
import User from '../src/models/User.js';
import Vendor from '../src/models/Vendor.js';
import { regenerateActionsForUser } from '../src/services/actionService.js';

const email = (process.env.SEED_EMAIL || 'demo@eventsync.test').trim().toLowerCase();
const suppliedPassword = process.env.SEED_PASSWORD;
const password = suppliedPassword || crypto.randomBytes(9).toString('base64url').slice(0, 12);
const reset = process.argv.includes('--reset');
const DAY = 24 * 60 * 60 * 1000;

// A date `days` from today at 10:00 local time, so demo events look natural.
function daysFromNow(days) {
  const date = new Date(Date.now() + days * DAY);
  date.setHours(10, 0, 0, 0);
  return date;
}

async function removePlannerData(userId) {
  await Promise.all([
    ActionItem.deleteMany({ userId }),
    EventVendor.deleteMany({ userId }),
    Task.deleteMany({ userId }),
    Event.deleteMany({ userId }),
    Vendor.deleteMany({ userId }),
    Client.deleteMany({ userId })
  ]);
  await User.deleteOne({ _id: userId });
}

async function createDemoData(user) {
  const userId = user._id;

  const clients = await Client.create([
    { userId, name: 'Ravi Kumar', phone: '+919876543210', email: 'ravi@example.com', status: 'Booked', address: 'Indiranagar, Bengaluru' },
    { userId, name: 'Ananya Sharma', phone: '+919876543211', email: 'ananya@example.com', status: 'Booked' },
    { userId, name: 'Priya Menon', phone: '+919876543212', email: 'priya@nexus.example', status: 'Contacted', address: 'Nexus Corp, Whitefield' },
    { userId, name: 'Farah Khan', phone: '+919876543213', status: 'New' }
  ]);

  const vendors = await Vendor.create([
    { userId, name: 'Royal Caterers', serviceCategoryIds: ['catering'], phone: '+919800000001', email: 'hello@royalcaterers.example', address: 'MG Road' },
    { userId, name: 'Bloom & Branch', serviceCategoryIds: ['decor', 'florist'], phone: '+919800000002', email: 'studio@bloombranch.example' },
    { userId, name: 'Frame Story Studio', serviceCategoryIds: ['photography'], phone: '+919800000003', email: 'book@framestory.example' },
    { userId, name: 'The Lakehouse', serviceCategoryIds: ['venue'], phone: '+919800000004', email: 'events@lakehouse.example', address: 'Sarjapur Road' },
    { userId, name: 'SoundWave AV', serviceCategoryIds: ['sound_lighting'], phone: '+919800000005', email: 'av@soundwave.example' }
  ]);

  const [caterer, decor, photographer, venue, av] = vendors;

  const events = await Event.create([
    {
      userId,
      clientId: clients[0]._id,
      title: 'Ravi & Meera Wedding',
      eventTypeId: 'wedding',
      status: 'confirmed',
      startAt: daysFromNow(12),
      budget: { amount: 800000, spent: 350000, currency: 'INR' },
      notes: 'Beach-side ceremony followed by a reception.'
    },
    {
      userId,
      clientId: clients[1]._id,
      title: 'Ananya 30th Birthday',
      eventTypeId: 'milestone_birthday',
      status: 'planning',
      startAt: daysFromNow(25),
      budget: { amount: 150000, spent: 40000, currency: 'INR' }
    },
    {
      userId,
      clientId: clients[2]._id,
      title: 'Nexus Annual Conference',
      eventTypeId: 'conference',
      status: 'inquiry',
      startAt: daysFromNow(40),
      budget: { amount: 500000, spent: 0, currency: 'INR' },
      notes: 'Two-day conference, 250 guests.'
    },
    {
      userId,
      clientId: clients[3]._id,
      title: 'Farah Engagement',
      eventTypeId: 'engagement_party',
      status: 'completed',
      startAt: daysFromNow(-20),
      budget: { amount: 250000, spent: 245000, currency: 'INR' }
    }
  ]);

  const [wedding, birthday, conference, engagement] = events;

  await Task.create([
    { userId, eventId: wedding._id, title: 'Confirm catering menu', dueAt: daysFromNow(3), priority: 'high' },
    { userId, eventId: wedding._id, title: 'Send invitation proofs', dueAt: daysFromNow(6) },
    { userId, eventId: wedding._id, title: 'Finalise decor theme', dueAt: daysFromNow(9) },
    { userId, eventId: wedding._id, title: 'Book guest transport', dueAt: daysFromNow(10) },
    { userId, eventId: wedding._id, title: 'Book venue', status: 'completed', priority: 'high' },
    { userId, eventId: birthday._id, title: 'Confirm cake design', dueAt: daysFromNow(8) },
    { userId, eventId: birthday._id, title: 'Book a DJ', dueAt: daysFromNow(12), priority: 'high' },
    { userId, eventId: conference._id, title: 'Send sponsor deck', dueAt: daysFromNow(-2), priority: 'high' },
    { userId, eventId: conference._id, title: 'Confirm AV team', dueAt: daysFromNow(7) },
    { userId, eventId: engagement._id, title: 'Send thank-you notes', status: 'completed' }
  ]);

  await EventVendor.create([
    { userId, eventId: wedding._id, vendorId: caterer._id, serviceCategoryId: 'catering', status: 'booked', agreedAmount: 250000, notes: 'Menu tasting approved.' },
    { userId, eventId: wedding._id, vendorId: decor._id, serviceCategoryId: 'decor', status: 'contacted', agreedAmount: 90000 },
    { userId, eventId: wedding._id, vendorId: photographer._id, serviceCategoryId: 'photography', status: 'considering', agreedAmount: 60000 },
    { userId, eventId: birthday._id, vendorId: venue._id, serviceCategoryId: 'venue', status: 'booked', agreedAmount: 50000 },
    { userId, eventId: conference._id, vendorId: av._id, serviceCategoryId: 'sound_lighting', status: 'contacted', agreedAmount: 80000 }
  ]);

  // Rule suggestions plus one manual action, so the Action Center shows both.
  const generated = await regenerateActionsForUser(userId);
  await ActionItem.create({
    userId,
    eventId: wedding._id,
    clientId: clients[0]._id,
    dedupeKey: `manual:${crypto.randomUUID()}`,
    source: 'manual',
    type: 'manual',
    title: 'Call Ravi about final headcount',
    description: 'Confirm the guest count before the caterer order is locked.',
    priority: 'high',
    dueAt: daysFromNow(2)
  });

  return {
    clients: clients.length,
    vendors: vendors.length,
    events: events.length,
    tasks: 10,
    assignments: 5,
    actions: generated.total + 1
  };
}

async function main() {
  await connectDB();

  const existing = await User.findOne({ email });
  if (existing && !reset) {
    console.log(`Seed planner already exists: ${email}`);
    console.log('Run `npm run seed -- --reset` to rebuild the demo data.');
    return;
  }

  if (existing) {
    await removePlannerData(existing._id);
    console.log(`Removed the previous demo planner: ${email}`);
  }

  const user = await User.create({
    name: 'Demo Planner',
    email,
    password,
    businessName: 'Petal & Pine Events',
    plannerProfile: {
      eventTypeIds: ['wedding', 'milestone_birthday', 'engagement_party', 'conference'],
      onboardingCompletedAt: new Date(),
      timeZone: 'Asia/Kolkata',
      currency: 'INR'
    }
  });

  const counts = await createDemoData(user);

  console.log('\nDemo planner ready');
  console.log('------------------');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${suppliedPassword ? 'from SEED_PASSWORD' : password}`);
  console.log(`Clients: ${counts.clients} | Vendors: ${counts.vendors} | Events: ${counts.events}`);
  console.log(`Tasks: ${counts.tasks} | Assignments: ${counts.assignments} | Actions: ${counts.actions}`);
  console.log('\nStart the API with `npm run dev`, then log in from the client.');
}

try {
  await main();
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
