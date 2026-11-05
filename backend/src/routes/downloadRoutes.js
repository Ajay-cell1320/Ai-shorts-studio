const express = require('express');
const router = express.Router();
const { getClipOutputFilePath, getProjectFiles } = require('../services/downloadService');

router.get('/clip/:clipId', (req, res) => {
  const filePath = getClipOutputFilePath(req.params.clipId);
  res.download(filePath, `${req.params.clipId}_9x16.mp4`, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ ok: false, error: 'File download failed' });
    }
  });
});

router.get('/zip/:projectId', (req, res) => {
  const files = getProjectFiles(req.params.projectId);
  if (files.length === 0) {
    return res.status(404).json({ ok: false, error: 'No rendered clips found for ZIP export' });
  }
  // Stream the primary MP4 clip for MVP mobile compatibility
  const target = files[0];
  res.download(target.path, target.name);
});

module.exports = router;
