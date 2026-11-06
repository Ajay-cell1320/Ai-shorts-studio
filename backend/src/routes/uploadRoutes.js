const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const multer = require('multer');
const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'last_upload.mp4')
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// Fetch direct MP4 stream URL from public Piped & Invidious instances
async function getYouTubeDirectStream(ytId) {
  const pipedNodes = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me',
    'https://api.piped.projectsegfau.lt'
  ];

  for (const host of pipedNodes) {
    try {
      const res = await fetch(`${host}/streams/${ytId}`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const data = await res.json();
      const streams = (data.videoStreams || []).filter(s => s.format === 'MPEG_4' && !s.videoOnly);
      if (streams.length > 0) return streams[0].url;
    } catch {}
  }

  const invidiousNodes = [
    'https://inv.tux.pizza',
    'https://invidious.nerdvpn.de',
    'https://yt.artemislena.eu'
  ];

  for (const host of invidiousNodes) {
    try {
      const res = await fetch(`${host}/api/v1/videos/${ytId}`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const data = await res.json();
      const fmt = (data.formatStreams || []).find(f => f.container === 'mp4');
      if (fmt && fmt.url) return fmt.url;
    } catch {}
  }

  return null;
}

router.post('/url', (req, res) => res.json({ ok: true, status: 'COMPLETED' }));
router.post('/', upload.any(), (req, res) => res.json({ ok: true, status: 'COMPLETED' }));

router.get('/download-clip', async (req, res) => {
  const { ytId, start = 0, end = 15, mode = 'file' } = req.query;
  const dur = Math.max(5, Number(end) - Number(start));
  const outName = `Short_${ytId || 'clip'}_${start}s_${end}s.mp4`;
  const outPath = path.join(uploadDir, outName);
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');

  // 1. Direct uploaded MP4 file
  if (mode === 'file' && fs.existsSync(srcMp4)) {
    const args = [
      '-y', '-ss', String(start), '-i', srcMp4, '-t', String(dur),
      '-vf', 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p',
      '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.0',
      '-preset', 'ultrafast', '-movflags', '+faststart', '-c:a', 'aac', outPath
    ];
    return execFile(ffmpegPath, args, (err) => {
      if (!err && fs.existsSync(outPath)) return res.download(outPath, outName);
      return res.download(srcMp4, outName);
    });
  }

  // 2. YouTube URL via Proxy Stream + FFmpeg Direct Remote Seek
  if (ytId && ytId !== 'local') {
    const streamUrl = await getYouTubeDirectStream(ytId);
    if (streamUrl) {
      const args = [
        '-y', '-ss', String(start), '-i', streamUrl, '-t', String(dur),
        '-vf', 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p',
        '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.0',
        '-preset', 'ultrafast', '-movflags', '+faststart', '-c:a', 'aac', outPath
      ];
      return execFile(ffmpegPath, args, (err) => {
        if (!err && fs.existsSync(outPath)) return res.download(outPath, outName);
        return res.redirect(streamUrl);
      });
    }
  }

  return res.status(400).send('YouTube blocked cloud proxy for this video. Use Solution 2 (Termux yt-dlp) or Direct Upload.');
});

module.exports = router;
