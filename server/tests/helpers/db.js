import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Starts an in-memory MongoDB so tests never touch the real database.
let mongoServer;

export async function startDb() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

export async function clearDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function stopDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer?.stop();
}
