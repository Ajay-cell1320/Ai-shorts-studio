const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { hashPassword, verifyPassword, signToken } = require('../services/authService');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password required' });
  }
  const cleanEmail = email.toLowerCase().trim();
  if (db.memoryStore.users.has(cleanEmail)) {
    return res.status(409).json({ ok: false, error: 'Account already exists' });
  }
  const user = {
    id: 'usr_' + Date.now(),
    name: name || cleanEmail.split('@')[0],
    email: cleanEmail,
    passwordHash: hashPassword(password),
    plan: 'FREE',
    creditsRemaining: 3
  };
  db.memoryStore.users.set(cleanEmail, user);
  const token = signToken({ id: user.id, email: user.email, name: user.name, plan: user.plan });
  res.status(201).json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, creditsRemaining: user.creditsRemaining } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = (email || '').toLowerCase().trim();
  const user = db.memoryStore.users.get(cleanEmail);

  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    return res.status(401).json({ ok: false, error: 'Invalid email or password' });
  }
  const token = signToken({ id: user.id, email: user.email, name: user.name, plan: user.plan });
  res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, creditsRemaining: user.creditsRemaining } });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
