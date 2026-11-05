const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { transcribeProjectVideo } = require('../services/transcriptionService');

router.post('/generate', async (req, res) => {
  try {
    const { projectId = 'demo_proj', language = 'Hinglish' } = req.body || {};
    const transcript = await transcribeProjectVideo(projectId, language);
    res.json({
      ok: true,
      message: 'Transcript generated with timestamps',
      transcript
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/:projectId', (req, res) => {
  const transcript = db.memoryStore.transcripts?.get(req.params.projectId);
  if (!transcript) {
    return res.status(404).json({ ok: false, error: 'Transcript not found' });
  }
  res.json({ ok: true, transcript });
});

module.exports = router;
