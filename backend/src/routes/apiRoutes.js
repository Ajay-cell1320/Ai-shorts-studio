const express = require('express');
const router = express.Router();
const env = require('../config/env');
const db = require('../config/db');
const { createJob, getJob, listJobs } = require('../workers/jobQueue');

router.get('/health', async (req, res) => {
  let dbConnected = env.hasSupabaseKeys;
  if (dbConnected) {
    try {
      await db.query('SELECT 1');
    } catch {
      dbConnected = false;
    }
  }

  res.json({
    ok: true,
    service: 'AI Shorts Studio Backend',
    phase: 6,
    timestamp: new Date().toISOString(),
    database: {
      active: dbConnected,
      mode: env.hasSupabaseKeys ? 'Supabase PostgreSQL' : 'Resilient Memory Fallback'
    },
    servicesConfigured: {
      geminiAi: env.hasGeminiKey,
      transcription: env.hasTranscriptionKey
    }
  });
});

router.post('/jobs', (req, res) => {
  const { type, projectId } = req.body || {};
  if (!type) return res.status(400).json({ ok: false, error: 'Job type required' });
  const job = createJob(type, { projectId: projectId || 'demo_proj' });
  res.status(202).json({ ok: true, message: 'Job queued', job });
});

router.get('/jobs', (req, res) => res.json({ ok: true, jobs: listJobs() }));

router.get('/jobs/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
  res.json({ ok: true, job });
});

module.exports = router;

const authRoutes = require('./authRoutes');
router.use('/auth', authRoutes);

const uploadRoutes = require('./uploadRoutes');
router.use('/uploads', uploadRoutes);

const transcriptionRoutes = require('./transcriptionRoutes');
router.use('/transcription', transcriptionRoutes);

const analysisRoutes = require('./analysisRoutes');
router.use('/analysis', analysisRoutes);

const highlightRoutes = require('./highlightRoutes');
router.use('/highlights', highlightRoutes);

const ffmpegRoutes = require('./ffmpegRoutes');
router.use('/ffmpeg', ffmpegRoutes);

const shortsRoutes = require('./shortsRoutes');
router.use('/shorts', shortsRoutes);

const captionRoutes = require('./captionRoutes');
router.use('/captions', captionRoutes);

const downloadRoutes = require('./downloadRoutes');
router.use('/downloads', downloadRoutes);

const monetizationRoutes = require('./monetizationRoutes');
router.use('/monetization', monetizationRoutes);
