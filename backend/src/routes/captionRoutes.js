const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { generateAndBurnCaptions, TEMPLATE_PRESETS } = require('../services/captionService');

router.get('/templates', (req, res) => {
  res.json({ ok: true, templates: Object.keys(TEMPLATE_PRESETS), presets: TEMPLATE_PRESETS });
});

router.post('/render', async (req, res) => {
  try {
    const result = await generateAndBurnCaptions(req.body || {});
    res.status(201).json({
      ok: true,
      message: 'ASS subtitles generated & cloud FFmpeg subtitle burn queued',
      ...result
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/:clipId', (req, res) => {
  const sub = db.memoryStore.subtitles?.get(req.params.clipId);
  if (!sub) return res.status(404).json({ ok: false, error: 'Subtitles not found' });
  res.json({ ok: true, subtitle: sub });
});

module.exports = router;
