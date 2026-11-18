import jwt from 'jsonwebtoken';
import User from '../../src/models/User.js';

let counter = 0;

// Creates a planner directly in the database and signs a token for API calls.
export async function createPlanner(overrides = {}) {
  counter += 1;
  const user = await User.create({
    name: 'Test Planner',
    email: `planner${counter}@example.com`,
    password: 'password123',
    businessName: 'Test Events Co',
    ...overrides
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
}
