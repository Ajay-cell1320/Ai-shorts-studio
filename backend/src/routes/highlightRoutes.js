const express = require('express');
const router = express.Router();
const { detectAndRankHighlights } = require('../services/highlightService');

router.post('/detect', async (req, res) => {
  try {
    const { projectId = 'proj_test_1', targetDuration = 'AUTO' } = req.body || {};
    const highlights = await detectAndRankHighlights(projectId, targetDuration);
    res.json({
      ok: true,
      projectId,
      targetDuration,
      count: highlights.length,
      highlights
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
