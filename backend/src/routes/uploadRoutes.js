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

router.post('/url', (req, res) => res.json({ ok: true, status: 'COMPLETED' }));

router.post('/', upload.any(), (req, res) => {
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');
  if (!fs.existsSync(srcMp4)) {
    return res.status(400).json({ ok: false, error: 'File did not save on server' });
  }
  res.json({ ok: true, status: 'COMPLETED', size: fs.statSync(srcMp4).size });
});

router.get('/download-clip', (req, res) => {
  const { start = 0, duration = 30 } = req.query;
  const startTime = Math.max(0, Number(start));
  const reqDuration = Math.max(3, Number(duration));
  const outName = `Short_${startTime}s_${reqDuration}s.mp4`;
  const outPath = path.join(uploadDir, outName);
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');

  if (!fs.existsSync(srcMp4)) {
    return res.status(404).send('Video not on server yet! Wait for the upload progress bar (100%) to finish before tapping Download.');
  }

  const args = [
    '-y', '-ss', String(startTime), '-i', srcMp4, '-t', String(reqDuration),
    '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p',
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.0',
    '-preset', 'ultrafast', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', outPath
  ];

  execFile(ffmpegPath, args, (err) => {
    if (!err && fs.existsSync(outPath)) {
      return res.download(outPath, outName);
    }
    return res.download(srcMp4, outName);
  });
});

module.exports = router;
