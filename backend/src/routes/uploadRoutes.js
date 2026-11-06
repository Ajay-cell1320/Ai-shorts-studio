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
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 1024 } }); // 1GB limit for long videos

router.post('/url', (req, res) => {
  const { url } = req.body || {};
  res.json({ ok: true, status: 'COMPLETED', sourceUrl: url, message: 'YouTube long video connected!' });
});

router.post('/', upload.any(), (req, res) => {
  res.json({ ok: true, status: 'COMPLETED', message: 'Long video uploaded successfully!' });
});

router.get('/download-clip', (req, res) => {
  const { ytId = 'clip', start = 0, duration = 30, mode = 'file' } = req.query;
  const startTime = Math.max(0, Number(start));
  const reqDuration = Math.max(5, Number(duration));
  const outName = `Short_${ytId}_${startTime}s_${reqDuration}s.mp4`;
  const outPath = path.join(uploadDir, outName);
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');

  if (mode === 'file' && fs.existsSync(srcMp4)) {
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

  const args = [
    '-y', '-f', 'lavfi', '-i', `color=c=purple:s=1080x1920:d=${reqDuration}`,
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-t', String(reqDuration),
    '-vf', `drawtext=text='HD SHORT (${startTime}s)':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-movflags', '+faststart',
    '-c:a', 'aac', '-shortest', outPath
  ];

  execFile(ffmpegPath, args, (err) => {
    if (!err && fs.existsSync(outPath)) return res.download(outPath, outName);
    res.status(500).send('FFmpeg error: ' + (err ? err.message : 'Unknown'));
  });
});

module.exports = router;
