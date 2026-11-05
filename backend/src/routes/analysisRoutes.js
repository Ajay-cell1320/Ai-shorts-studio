const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { analyzeTranscriptWithGemini } = require('../services/geminiService');

router.post('/analyze', async (req, res) => {
  try {
    const { projectId = 'proj_test_1' } = req.body || {};
    const result = await analyzeTranscriptWithGemini(projectId);
    res.json({
      ok: true,
      projectId,
      mode: result.mode,
      clipCount: result.clips.length,
      clips: result.clips
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/:projectId/clips', (req, res) => {
  const clips = db.memoryStore.clips.get(req.params.projectId) || [];
  res.json({ ok: true, clips });
});

module.exports = router;
