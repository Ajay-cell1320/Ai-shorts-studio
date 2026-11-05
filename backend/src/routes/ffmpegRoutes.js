const express = require('express');
const router = express.Router();
const { queueCloudFfmpegRender, cleanupExpiredTempFiles } = require('../workers/ffmpegWorker');

router.post('/render', async (req, res) => {
  try {
    const { clipId, startTime = 15, duration = 30, layout = 'blurred-bg' } = req.body || {};
    const result = await queueCloudFfmpegRender({ clipId, startTime, duration, layout });
    res.status(202).json({
      ok: true,
      message: 'Cloud FFmpeg 9:16 render job queued',
      ...result
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/cleanup', (req, res) => {
  const result = cleanupExpiredTempFiles(0);
  res.json({ ok: true, message: 'Temporary storage cleaned', ...result });
});

module.exports = router;
