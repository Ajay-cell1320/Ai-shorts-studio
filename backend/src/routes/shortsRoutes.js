const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { generateVerticalShortsBatch, VALID_DURATIONS } = require('../services/shortsGeneratorService');

router.post('/generate', async (req, res) => {
  try {
    const { projectId = 'proj_test_1', duration = 'AUTO', layout = 'blurred-bg' } = req.body || {};
    const result = await generateVerticalShortsBatch({
      projectId,
      durationOption: duration,
      layout
    });
    res.status(201).json({
      ok: true,
      message: 'Multiple vertical 9:16 MP4 Shorts generated',
      supportedDurations: VALID_DURATIONS,
      ...result
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/:projectId', (req, res) => {
  const shorts = db.memoryStore.clips.get(req.params.projectId) || [];
  res.json({ ok: true, count: shorts.length, shorts });
});

module.exports = router;
