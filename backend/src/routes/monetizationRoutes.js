const express = require('express');
const router = express.Router();
const { PLANS, getUserCredits, deductUserCredit } = require('../services/monetizationService');

router.get('/plans', (req, res) => {
  res.json({ ok: true, plans: PLANS });
});

router.post('/deduct', (req, res) => {
  const { email } = req.body || {};
  const result = deductUserCredit(email);
  if (!result.success) {
    return res.status(403).json({ ok: false, error: result.error });
  }
  res.json({ ok: true, ...result });
});

module.exports = router;
