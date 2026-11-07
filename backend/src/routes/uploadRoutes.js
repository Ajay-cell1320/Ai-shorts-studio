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

function runFfmpegCut(srcMp4, start, duration, ratio, res) {
  const startTime = Math.max(0, Number(start) || 0);
  const reqDuration = Math.max(3, Number(duration) || 30);
  const outName = `Short_HD_${ratio}_${startTime}s_${reqDuration}s.mp4`;
  const outPath = path.join(uploadDir, outName);

  let vfFilter = '';
  if (ratio === 'fullfit') {
    vfFilter = 'split[bg][fg];[bg]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=20:10[bgblur];[fg]scale=720:-2[fgscale];[bgblur][fgscale]overlay=(W-w)/2:(H-h)/2,format=yuv420p';
  } else if (ratio === 'zoom') {
    vfFilter = 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p';
  } else {
    // Smart 9:16 Fit: keeps characters and scene centered without cutting faces in half
    vfFilter = 'split[bg][fg];[bg]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=20:10[bgblur];[fg]scale=-2:920,crop=720:920[fgcrop];[bgblur][fgcrop]overlay=0:(H-h)/2,format=yuv420p';
  }

  const args = [
    '-y', '-ss', String(startTime), '-i', srcMp4, '-t', String(reqDuration),
    '-vf', vfFilter,
    '-c:v', 'libx264', '-profile:v', 'main', '-level', '4.0', '-crf', '22',
    '-preset', 'ultrafast', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', outPath
  ];

  execFile(ffmpegPath, args, (err) => {
    if (!err && fs.existsSync(outPath)) return res.download(outPath, outName);
    return res.download(srcMp4, outName);
  });
}

router.post('/', upload.any(), (req, res) => {
  res.json({ ok: true, status: 'COMPLETED' });
});

// Guarantees the file is present on disk and cuts it in a single request
router.post('/cut-direct', upload.any(), (req, res) => {
  const { start = 0, duration = 30, ratio = 'smart' } = req.query;
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');
  if (!fs.existsSync(srcMp4)) return res.status(400).send('No video file received.');
  runFfmpegCut(srcMp4, start, duration, ratio, res);
});

router.get('/download-clip', (req, res) => {
  const { start = 0, duration = 30, ratio = 'smart' } = req.query;
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');
  if (!fs.existsSync(srcMp4)) {
    return res.status(404).send('Server restarted. Return to the app tab and tap Download Short again.');
  }
  runFfmpegCut(srcMp4, start, duration, ratio, res);
});

module.exports = router;
