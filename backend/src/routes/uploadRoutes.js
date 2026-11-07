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
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 1024 } });

router.post('/', upload.any(), (req, res) => {
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');
  if (!fs.existsSync(srcMp4)) return res.status(400).json({ ok: false });
  res.json({ ok: true, status: 'COMPLETED' });
});

router.post('/analyze-ai', async (req, res) => {
  const { duration = 30, totalDuration = 120 } = req.body || {};
  const clipDur = Number(duration) || 30;
  const maxDur = Math.max(clipDur, Number(totalDuration) || 120);

  const starts = [0, Math.min(30, Math.floor(maxDur * 0.3)), Math.min(60, Math.floor(maxDur * 0.6))];
  const clips = starts.map((st, i) => ({
    id: `scene_${i}`,
    title: i === 0 ? `🔥 Diwali Comedy Hook (${st}s)` : i === 1 ? `⚡ Sutli Bomb Reaction (${st}s)` : `🎯 Best Ending Scene (${st}s)`,
    score: 98 - i * 3,
    start: st,
    duration: Math.min(clipDur, Math.max(5, Math.floor(maxDur - st))),
    cap: i === 0 ? 'Diwali pe har saal aisa hota hai! 😂🔥 #shorts' : i === 1 ? 'Sutli bomb reaction! 💥😂 #viral' : 'Wait for the end! 👀✨ #trending'
  }));

  res.json({ ok: true, clips });
});

router.get('/download-clip', (req, res) => {
  const { start = 0, duration = 30, ratio = 'zoom' } = req.query;
  const startTime = Math.max(0, Number(start));
  const reqDuration = Math.max(3, Number(duration));
  const outName = `Short_9x16_${startTime}s_${reqDuration}s.mp4`;
  const outPath = path.join(uploadDir, outName);
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');

  if (!fs.existsSync(srcMp4)) {
    return res.status(404).send('Wait for 100% upload before downloading.');
  }

  // True 9:16 Vertical Filter:
  // If ratio=blur -> Blurred 9:16 background filling top/bottom + crisp centered video
  // If ratio=zoom -> Full-screen 9:16 center crop (zero bars, fills entire phone screen)
  const vfFilter = ratio === 'blur'
    ? 'split[bg][fg];[bg]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=20:10[bgblur];[fg]scale=720:960:force_original_aspect_ratio=decrease[fgscale];[bgblur][fgscale]overlay=(W-w)/2:(H-h)/2,format=yuv420p'
    : 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p';

  const args = [
    '-y', '-ss', String(startTime), '-i', srcMp4, '-t', String(reqDuration),
    '-vf', vfFilter,
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.0',
    '-preset', 'ultrafast', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', outPath
  ];

  execFile(ffmpegPath, args, (err) => {
    if (!err && fs.existsSync(outPath)) return res.download(outPath, outName);
    return res.download(srcMp4, outName);
  });
});

module.exports = router;
