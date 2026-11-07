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

function runFastFfmpegCut(srcMp4, start, duration, ratio, res) {
  const startTime = Math.max(0, Number(start) || 0);
  const reqDuration = Math.max(3, Number(duration) || 30);
  // Unique filename with random ID so multiple parallel downloads never overwrite each other
  const uniqueId = Math.random().toString(36).substring(2, 7);
  const outName = `Short_${ratio}_${startTime}s_${reqDuration}s_${uniqueId}.mp4`;
  const outPath = path.join(uploadDir, outName);

  let vfFilter = '';
  if (ratio === 'fullfit') {
    vfFilter = 'split[bg][fg];[bg]scale=90:160:force_original_aspect_ratio=increase,crop=90:160,boxblur=3:1,scale=720:1280[bgblur];[fg]scale=720:-2[fgscale];[bgblur][fgscale]overlay=(W-w)/2:(H-h)/2,format=yuv420p';
  } else if (ratio === 'zoom') {
    vfFilter = 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p';
  } else {
    vfFilter = 'split[bg][fg];[bg]scale=90:160:force_original_aspect_ratio=increase,crop=90:160,boxblur=3:1,scale=720:1280[bgblur];[fg]scale=-2:920,crop=720:920[fgcrop];[bgblur][fgcrop]overlay=0:(H-h)/2,format=yuv420p';
  }

  const args = [
    '-y', '-ss', String(startTime), '-i', srcMp4, '-t', String(reqDuration),
    '-vf', vfFilter,
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-crf', '26',
    '-preset', 'ultrafast', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '128k', outPath
  ];

  execFile(ffmpegPath, args, (err) => {
    if (!err && fs.existsSync(outPath)) {
      return res.download(outPath, `Short_${ratio}_${startTime}s_${reqDuration}s.mp4`, () => {
        try { fs.unlinkSync(outPath); } catch {}
      });
    }
    return res.status(500).send('FFmpeg cut error');
  });
}

router.post('/', upload.any(), (req, res) => {
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');
  if (!fs.existsSync(srcMp4)) return res.status(400).json({ ok: false });
  res.json({ ok: true, status: 'COMPLETED' });
});

// Parallel fast cut endpoint (can be called multiple times at once!)
router.get('/cut-fast', (req, res) => {
  const { start = 0, duration = 30, ratio = 'smart' } = req.query;
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');
  if (!fs.existsSync(srcMp4)) return res.status(404).send('NEED_UPLOAD');
  runFastFfmpegCut(srcMp4, start, duration, ratio, res);
});

router.post('/cut-direct', upload.any(), (req, res) => {
  const { start = 0, duration = 30, ratio = 'smart' } = req.query;
  const srcMp4 = path.join(uploadDir, 'last_upload.mp4');
  if (!fs.existsSync(srcMp4)) return res.status(400).send('No video file received.');
  runFastFfmpegCut(srcMp4, start, duration, ratio, res);
});

module.exports = router;
