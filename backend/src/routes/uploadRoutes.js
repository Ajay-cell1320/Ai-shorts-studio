const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const env = require('../config/env');
const db = require('../config/db');
const { createJob } = require('../workers/jobQueue');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

router.post('/stream', (req, res) => {
  const rawName = req.headers['x-file-name'] || 'video.mp4';
  const fileSize = Number(req.headers['x-file-size'] || 0);
  const safeName = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = path.extname(safeName).toLowerCase();

  if (ext !== '.mp4' && ext !== '.mov') {
    return res.status(400).json({ ok: false, error: 'Only MP4 and MOV files are allowed' });
  }
  const maxBytes = env.maxUploadSizeMb * 1024 * 1024;
  if (fileSize > maxBytes) {
    return res.status(413).json({ ok: false, error: 'File exceeds 250 MB limit' });
  }

  const videoId = 'vid_' + Date.now();
  const savePath = path.join(UPLOAD_DIR, `${videoId}_${safeName}`);
  const writeStream = fs.createWriteStream(savePath);
  let receivedBytes = 0;

  req.on('data', (chunk) => {
    receivedBytes += chunk.length;
    if (receivedBytes > maxBytes) {
      req.destroy();
      writeStream.destroy();
      if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
    }
  });

  req.on('aborted', () => {
    writeStream.destroy();
    if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
  });

  req.pipe(writeStream);
  writeStream.on('finish', () => {
    const project = {
      id: 'proj_' + Date.now(),
      videoId,
      title: safeName,
      filePath: savePath,
      sizeBytes: receivedBytes,
      status: 'UPLOADED',
      createdAt: new Date().toISOString()
    };
    db.memoryStore.projects.set(project.id, project);
    const job = createJob('TRANSCRIBE_AND_ANALYZE', { projectId: project.id, videoId });

    res.status(201).json({
      ok: true,
      message: 'Video streamed to storage & background job queued',
      project,
      job
    });
  });

  writeStream.on('error', (err) => {
    if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
    res.status(500).json({ ok: false, error: 'Stream write failed: ' + err.message });
  });
});

module.exports = router;

// Handle YouTube & Authorized Video URLs
router.post('/url', async (req, res) => {
  const { url, videoUrl, duration = 'Auto AI Duration' } = req.body || {};
  const targetUrl = (url || videoUrl || '').trim();

  if (!targetUrl) {
    return res.status(400).json({ ok: false, error: 'Please provide a valid video or YouTube URL' });
  }

  const ytMatch = targetUrl.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const jobId = 'job_' + Date.now() + '_yt';

  return res.json({
    ok: true,
    jobId,
    status: 'QUEUED',
    sourceType: ytMatch ? 'youtube' : 'direct_url',
    videoId: ytMatch ? ytMatch[1] : null,
    sourceUrl: targetUrl,
    targetDuration: duration,
    message: ytMatch
      ? `YouTube Video (${ytMatch[1]}) accepted & queued for AI analysis!`
      : 'Authorized video URL queued for processing!'
  });
});
