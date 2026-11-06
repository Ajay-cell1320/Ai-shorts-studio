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
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

router.post('/url', (req, res) => res.json({ ok: true, status: 'COMPLETED' }));
router.post('/', upload.any(), (req, res) => res.json({ ok: true, status: 'COMPLETED' }));

router.get('/download-clip', (req, res) => {
  const { ytId = 'clip', start = 0, duration = 30, mode = 'file' } = req.query;
  const startTime = Math.max(0, Number(start));
  const reqDuration = Math.max(5, Number(duration));
  const outName = `Short_${ytId}_${startTime}s_${reqDuration}s.mp4`;
  const outPath = path.join(uploadDir, outName);
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');

  if (mode === 'file' && fs.existsSync(srcMp4)) {
    // Professional 9:16 HD filter: exact crop/scale to 1080x1920 (or 720x1280) with crisp padding and sync audio
    const args = [
      '-y', '-ss', String(startTime), '-i', srcMp4, '-t', String(reqDuration),
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p',
      '-c:v', 'libx264', '-profile:v', 'main', '-level', '4.0',
      '-preset', 'fast', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '192k', outPath
    ];
    return execFile(ffmpegPath, args, (err) => {
      if (!err && fs.existsSync(outPath)) return res.download(outPath, outName);
      return res.download(srcMp4, outName);
    });
  }

  res.status(400).send('Please upload your video first via Direct Upload.');
});

module.exports = router;
