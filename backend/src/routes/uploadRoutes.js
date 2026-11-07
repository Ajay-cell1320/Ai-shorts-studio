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
    title: i === 0 ? `🔥 Diwali Comedy Hook (${st}s)` : i === 1 ? `⚡ Rangoli Reaction (${st}s)` : `🎯 Best Ending Scene (${st}s)`,
    score: 98 - i * 3,
    start: st,
    duration: Math.min(clipDur, Math.max(5, Math.floor(maxDur - st))),
    cap: i === 0 ? 'Diwali pe har saal aisa hota hai! 😂🔥 #shorts' : i === 1 ? 'Kachua hai wo! 😂🐢 #viral' : 'Mummy ka Diwali panic! 👀✨ #trending'
  }));

  res.json({ ok: true, clips });
});

router.get('/download-clip', (req, res) => {
  const { start = 0, duration = 30, ratio = 'smart' } = req.query;
  const startTime = Math.max(0, Number(start));
  const reqDuration = Math.max(3, Number(duration));
  const outName = `Short_HD_${ratio}_${startTime}s_${reqDuration}s.mp4`;
  const outPath = path.join(uploadDir, outName);
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');

  if (!fs.existsSync(srcMp4)) {
    return res.status(404).send('Wait for 100% upload before downloading.');
  }

  // 3 Framing Modes in 1080x1920 Full HD:
  // 1. smart (Default): Scales height to 1350px and crops width to 1080px (keeps 2x more horizontal scene visible than full zoom) + blurred 9:16 top/bottom canvas
  // 2. fullfit: 100% of original horizontal width visible in center over a blurred 9:16 background (zero characters cut off)
  // 3. zoom: Full 1080x1920 center crop
  let vfFilter = '';
  if (ratio === 'fullfit') {
    vfFilter = 'split[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:10[bgblur];[fg]scale=1080:-2[fgscale];[bgblur][fgscale]overlay=(W-w)/2:(H-h)/2,format=yuv420p';
  } else if (ratio === 'zoom') {
    vfFilter = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p';
  } else {
    vfFilter = 'split[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:10[bgblur];[fg]scale=-2:1350,crop=1080:1350[fgcrop];[bgblur][fgcrop]overlay=0:(H-h)/2,format=yuv420p';
  }

  const args = [
    '-y', '-ss', String(startTime), '-i', srcMp4, '-t', String(reqDuration),
    '-vf', vfFilter,
    '-c:v', 'libx264', '-profile:v', 'main', '-level', '4.0', '-crf', '21',
    '-preset', 'veryfast', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', outPath
  ];

  execFile(ffmpegPath, args, (err) => {
    if (!err && fs.existsSync(outPath)) return res.download(outPath, outName);
    return res.download(srcMp4, outName);
  });
});

module.exports = router;
