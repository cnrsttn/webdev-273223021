const crypto = require('crypto');
const dbAccess = require('./db');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const hashedBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  return crypto.timingSafeEqual(hashedBuffer, keyBuffer);
}

async function registerUser(email, password, name) {
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }
  const existing = await dbAccess.getUserByEmail(email);
  if (existing) {
    throw new Error('Email is already registered');
  }
  const passwordHash = hashPassword(password);
  return await dbAccess.createUser(email, passwordHash, name);
}

async function authenticateUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const user = await dbAccess.getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid email or password');
  }
  return { id: user.id, email: user.email, name: user.name };
}

async function getStudyGroups() {
  return await dbAccess.getAllGroups();
}

async function addNewGroup(name, subject, description, creatorId) {
  if (!name || !subject || !description) {
    throw new Error('Name, subject, and description are required');
  }
  return await dbAccess.createGroup(name, subject, description, creatorId);
}

module.exports = {
  hashPassword,
  verifyPassword,
  registerUser,
  authenticateUser,
  getStudyGroups,
  addNewGroup
};
