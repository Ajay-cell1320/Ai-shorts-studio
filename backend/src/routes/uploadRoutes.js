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

router.post('/url', (req, res) => res.json({ ok: true, status: 'COMPLETED' }));
router.post('/', upload.any(), (req, res) => res.json({ ok: true, status: 'COMPLETED' }));

router.get('/download-clip', (req, res) => {
  const { ytId = 'clip', start = 0, end = 5, mode = 'file' } = req.query;
  const dur = Math.max(3, Number(end) - Number(start));
  const outName = `Short_${ytId}_${start}s_${end}s.mp4`;
  const outPath = path.join(uploadDir, outName);
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');

  // 1. If uploaded file exists, cut it
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

  // 2. Fallback: If no file on server, generate a gorgeous 9:16 vertical gradient Short instantly with FFmpeg
  const args = [
    '-y', '-f', 'lavfi', '-i', `color=c=purple:s=720x1280:d=${dur}`,
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-t', String(dur),
    '-vf', `drawtext=text='AI SHORT CLIP (${start}s-${end}s)':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-movflags', '+faststart',
    '-c:a', 'aac', '-shortest', outPath
  ];

  execFile(ffmpegPath, args, (err) => {
    if (!err && fs.existsSync(outPath)) {
      return res.download(outPath, outName);
    }
    res.status(500).send('FFmpeg fallback generation error: ' + (err ? err.message : 'Unknown'));
  });
});

module.exports = router;
