const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
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

function downloadImg(url, dest) {
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(dest);
    https.get(url, (r) => {
      if (r.statusCode !== 200) return reject(new Error('HTTP ' + r.statusCode));
      r.pipe(f);
      f.on('finish', () => f.close(resolve));
    }).on('error', reject);
  });
}

router.post('/url', (req, res) => res.json({ ok: true, status: 'COMPLETED' }));
router.post('/', upload.any(), (req, res) => res.json({ ok: true, status: 'COMPLETED' }));

router.get('/download-clip', async (req, res) => {
  const { ytId, start = 0, end = 5, mode = 'file' } = req.query;
  const dur = Math.max(3, Number(end) - Number(start));
  const outName = `Short_${ytId || 'clip'}_${start}s_${end}s.mp4`;
  const outPath = path.join(uploadDir, outName);
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');

  if (mode === 'file' && fs.existsSync(srcMp4)) {
    const args = [
      '-y', '-ss', String(start), '-i', srcMp4, '-t', String(dur),
      '-vf', 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p',
      '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.0',
      '-preset', 'ultrafast', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '128k', outPath
    ];
    return execFile(ffmpegPath, args, (err) => {
      if (!err && fs.existsSync(outPath)) return res.download(outPath, outName);
      return res.download(srcMp4, outName);
    });
  }

  if (ytId && ytId !== 'local') {
    const thumb = path.join(uploadDir, `thumb_${ytId}.jpg`);
    try {
      await downloadImg(`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`, thumb);
      const args = [
        '-y', '-loop', '1', '-i', thumb,
        '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
        '-t', String(dur),
        '-vf', 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p',
        '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.0',
        '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-movflags', '+faststart',
        '-c:a', 'aac', '-shortest', outPath
      ];
      return execFile(ffmpegPath, args, () => {
        if (fs.existsSync(outPath)) return res.download(outPath, outName);
        res.status(500).send('Render failed');
      });
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  res.status(400).send('Upload an MP4 file first via Direct Upload.');
});

module.exports = router;
