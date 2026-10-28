import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function createToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, businessName: user.businessName, createdAt: user.createdAt };
}

export async function registerUser({ name, email, password, businessName }) {
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required');
    error.statusCode = 400;
    throw error;
  }
  if (await User.findOne({ email: email.toLowerCase().trim() })) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }
  const user = await User.create({ name, email, password, businessName });
  return { user: publicUser(user), token: createToken(user._id) };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
  return { user: publicUser(user), token: createToken(user._id) };
}

export function getPublicUser(user) {
  return publicUser(user);
}
