const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const multer = require('multer');
const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Save to a temporary incoming file first, then atomically rename so FFmpeg never reads a half-written file
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp4`)
});
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 1024 } });

const srcMp4 = path.join(uploadDir, 'last_upload.mp4');

// Sequential Promise Queue so multiple downloads never crash Render RAM or corrupt MP4 headers
let encodeQueue = Promise.resolve();

function enqueueCutJob(inputFile, start, duration, ratio, res, cleanupInput = false) {
  encodeQueue = encodeQueue.then(() => new Promise((resolve) => {
    const startTime = Math.max(0, Number(start) || 0);
    const reqDuration = Math.max(3, Number(duration) || 30);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const outPath = path.join(uploadDir, `Short_${uniqueId}.mp4`);

    let vfFilter = '';
    if (ratio === 'fullfit') {
      vfFilter = 'split[bg][fg];[bg]scale=90:160:force_original_aspect_ratio=increase,crop=90:160,boxblur=3:1,scale=720:1280[bgblur];[fg]scale=720:-2[fgscale];[bgblur][fgscale]overlay=(W-w)/2:(H-h)/2,format=yuv420p';
    } else if (ratio === 'zoom') {
      vfFilter = 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p';
    } else {
      vfFilter = 'split[bg][fg];[bg]scale=90:160:force_original_aspect_ratio=increase,crop=90:160,boxblur=3:1,scale=720:1280[bgblur];[fg]scale=-2:920,crop=720:920[fgcrop];[bgblur][fgcrop]overlay=0:(H-h)/2,format=yuv420p';
    }

    const args = [
      '-y', '-ss', String(startTime), '-i', inputFile, '-t', String(reqDuration),
      '-vf', vfFilter,
      '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-crf', '25',
      '-preset', 'ultrafast', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '128k', outPath
    ];

    execFile(ffmpegPath, args, (err) => {
      if (cleanupInput && inputFile !== srcMp4) {
        try { fs.unlinkSync(inputFile); } catch {}
      }

      // Verify output MP4 is valid and non-empty (> 10KB) so phone never gets a broken file
      if (!err && fs.existsSync(outPath) && fs.statSync(outPath).size > 10240) {
        res.setHeader('Content-Type', 'video/mp4');
        return res.download(outPath, `Short_${ratio}_${startTime}s_${reqDuration}s.mp4`, () => {
          try { fs.unlinkSync(outPath); } catch {}
          resolve();
        });
      } else {
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
        res.status(500).json({ error: 'FFmpeg encode failed or invalid MP4' });
        resolve();
      }
    });
  })).catch(() => {});
}

router.post('/', upload.any(), (req, res) => {
  const uploaded = req.files?.[0];
  if (!uploaded || !fs.existsSync(uploaded.path)) {
    return res.status(400).json({ ok: false });
  }
  fs.renameSync(uploaded.path, srcMp4);
  res.json({ ok: true, status: 'COMPLETED' });
});

router.get('/cut-fast', (req, res) => {
  const { start = 0, duration = 30, ratio = 'smart' } = req.query;
  if (!fs.existsSync(srcMp4) || fs.statSync(srcMp4).size < 10240) {
    return res.status(404).send('NEED_UPLOAD');
  }
  enqueueCutJob(srcMp4, start, duration, ratio, res, false);
});

router.post('/cut-direct', upload.any(), (req, res) => {
  const { start = 0, duration = 30, ratio = 'smart' } = req.query;
  const uploaded = req.files?.[0];
  if (!uploaded || !fs.existsSync(uploaded.path)) {
    return res.status(400).send('No video file received.');
  }
  // Copy to srcMp4 cache so future cuts are fast, and cut from the unique temp file
  try { fs.copyFileSync(uploaded.path, srcMp4); } catch {}
  enqueueCutJob(uploaded.path, start, duration, ratio, res, true);
});

module.exports = router;
