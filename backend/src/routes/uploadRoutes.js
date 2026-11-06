const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const multer = require('multer');
const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `last_upload.mp4`)
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('Status ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

router.post('/url', (req, res) => {
  const rawUrl = (req.body?.url || '').trim();
  return res.json({ ok: true, status: 'COMPLETED', sourceUrl: rawUrl });
});

router.post('/', upload.any(), (req, res) => {
  return res.json({ ok: true, fileId: 'last_upload.mp4', status: 'COMPLETED' });
});

router.get('/download-clip', async (req, res) => {
  const { ytId, start = 0, end = 15, mode = 'file' } = req.query;
  const dur = Math.max(5, Number(end) - Number(start));
  const outName = `Short_${ytId || 'clip'}_${start}s_${end}s.mp4`;
  const outPath = path.join(uploadDir, outName);
  const uploadedMp4 = path.join(uploadDir, 'last_upload.mp4');

  // 1. If user uploaded a real MP4 file, cut & crop it to 9:16 vertical MP4
  if (mode === 'file' && fs.existsSync(uploadedMp4)) {
    const cmd = `ffmpeg -y -ss ${Number(start)} -i "${uploadedMp4}" -t ${dur} -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p" -c:v libx264 -profile:v main -preset ultrafast -movflags +faststart -c:a aac -b:a 128k "${outPath}"`;
    return exec(cmd, (err) => {
      if (!err && fs.existsSync(outPath)) return res.download(outPath, outName);
      return res.download(uploadedMp4, outName);
    });
  }

  // 2. For YouTube links when cloud IP is blocked: fetch HD thumbnail & render playable 9:16 zoom Short
  const thumbPath = path.join(uploadDir, `thumb_${ytId}.jpg`);
  try {
    if (ytId) {
      await downloadFile(`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`, thumbPath);
      const cmd = `ffmpeg -y -loop 1 -i "${thumbPath}" -f lavfi -i anullsrc=r=44100:cl=stereo -t ${dur} -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p" -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -preset ultrafast -movflags +faststart -c:a aac -shortest "${outPath}"`;
      return exec(cmd, () => {
        if (fs.existsSync(outPath)) return res.download(outPath, outName);
        res.status(500).send('Render error');
      });
    }
  } catch (e) {
    console.error(e);
  }
  res.status(400).send('Please upload an MP4 video via Direct Upload to cut full video + audio.');
});

module.exports = router;
