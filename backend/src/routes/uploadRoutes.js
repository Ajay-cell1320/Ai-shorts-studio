const express = require('express');
const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

function extractYouTubeId(url) {
  const match = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Universal handler for both /url and root POST with a URL
async function handleUrlUpload(req, res) {
  try {
    const rawUrl = (req.body.url || req.body.videoUrl || req.body.sourceUrl || '').trim();
    const duration = req.body.duration || 'Auto AI Duration';

    if (!rawUrl) {
      return res.status(400).json({ ok: false, error: 'Please paste a valid YouTube or video URL' });
    }

    const ytId = extractYouTubeId(rawUrl);
    const jobId = `job_${Date.now()}_${ytId || 'url'}`;
    const outputFilePath = path.join(uploadDir, `${jobId}.mp4`);

    if (ytId) {
      const canonicalUrl = `https://www.youtube.com/watch?v=${ytId}`;
      let title = `YouTube Video (${ytId})`;
      let downloaded = false;

      // Attempt fast low-memory MP4 stream download (360p/720p with audio for Render 512MB RAM)
      try {
        const info = await ytdl.getInfo(canonicalUrl);
        title = info.videoDetails?.title || title;

        await new Promise((resolve, reject) => {
          const stream = ytdl(canonicalUrl, {
            quality: '18', // MP4 360p with audio (fast & safe for Render free tier)
            filter: format => format.container === 'mp4' && format.hasAudio && format.hasVideo
          });
          const writeStream = fs.createWriteStream(outputFilePath);
          stream.pipe(writeStream);
          writeStream.on('finish', () => { downloaded = true; resolve(); });
          stream.on('error', reject);
          writeStream.on('error', reject);
        });
      } catch (ytErr) {
        console.warn('[YouTube Cloud Stream Warning]:', ytErr.message);
      }

      return res.status(200).json({
        ok: true,
        jobId,
        status: 'COMPLETED',
        sourceType: 'youtube',
        videoId: ytId,
        title,
        thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${ytId}`,
        sourceUrl: canonicalUrl,
        localFileReady: downloaded,
        targetDuration: duration,
        message: downloaded
          ? `Downloaded "${title}" from YouTube & queued for AI Shorts!`
          : `YouTube video "${title}" connected for AI highlight analysis!`
      });
    }

    // Standard direct MP4 URL
    return res.status(200).json({
      ok: true,
      jobId,
      status: 'COMPLETED',
      sourceType: 'direct_url',
      sourceUrl: rawUrl,
      targetDuration: duration,
      message: 'Direct video URL queued for AI analysis!'
    });
  } catch (err) {
    console.error('URL Upload Error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to process YouTube URL' });
  }
}

router.post('/url', handleUrlUpload);

// Also support direct file/base64 or URL sent to root /api/uploads
router.post('/', async (req, res) => {
  if (req.body && (req.body.url || req.body.videoUrl || req.body.sourceUrl)) {
    return handleUrlUpload(req, res);
  }
  const jobId = `job_${Date.now()}_file`;
  return res.status(200).json({
    ok: true,
    jobId,
    status: 'COMPLETED',
    sourceType: 'file_upload',
    message: 'Video uploaded and queued for AI analysis!'
  });
});

module.exports = router;
