const crypto = require('crypto');
const db = require('../config/db');

const SECRET = process.env.JWT_SECRET || 'ai-shorts-studio-mobile-secret-2026';

if (!db.memoryStore.users) {
  db.memoryStore.users = new Map();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(8).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return key === hash;
}

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
