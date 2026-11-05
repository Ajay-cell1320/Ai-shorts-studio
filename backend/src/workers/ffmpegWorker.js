const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { createJob } = require('./jobQueue');

const RENDER_DIR = path.join(__dirname, '../../renders');
if (!fs.existsSync(RENDER_DIR)) {
  fs.mkdirSync(RENDER_DIR, { recursive: true });
}

function buildVerticalFilter(layout = 'blurred-bg', assSubtitlePath = null) {
  let vf = '';
  if (layout === 'smart-crop') {
    vf = 'crop=ih*9/16:ih:(iw-ow)/2:0,scale=1080:1920';
  } else {
    vf = 'split[original][copy];[copy]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:10[bg];[original]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2';
  }
  if (assSubtitlePath) {
    vf += `,ass=${assSubtitlePath}`;
  }
  return vf;
}

function buildFfmpegArgs({ inputPath, outputPath, startTime, duration, layout, assSubtitlePath }) {
  const vf = buildVerticalFilter(layout, assSubtitlePath);
  return [
    '-y',
    '-ss', String(startTime || 0),
    '-t', String(duration || 30),
    '-i', inputPath || 'cloud_source.mp4',
    '-vf', vf,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    outputPath
  ];
}

async function queueCloudFfmpegRender(options) {
  const clipId = options.clipId || 'clip_' + Date.now();
  const outputPath = path.join(RENDER_DIR, `${clipId}_9x16.mp4`);
  const args = buildFfmpegArgs({ ...options, outputPath });
  const commandString = `ffmpeg ${args.join(' ')}`;

  const workerUrl = process.env.CLOUD_FFMPEG_WORKER_URL;
  const executionMode = workerUrl
    ? 'REMOTE_CLOUD_WORKER'
    : 'CLOUD_CONTAINER_QUEUED (Phone CPU Protected)';

  const job = createJob('CLOUD_FFMPEG_RENDER', {
    clipId,
    layout: options.layout || 'blurred-bg',
    resolution: '1080x1920',
    aspectRatio: '9:16',
    executionMode,
    commandString,
    outputPath
  });

  return { job, commandString, executionMode, outputPath };
}

function cleanupExpiredTempFiles(maxAgeMinutes = 60) {
  const now = Date.now();
  let removed = 0;
  for (const dir of [RENDER_DIR, path.join(__dirname, '../../uploads')]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > maxAgeMinutes * 60 * 1000) {
        fs.unlinkSync(fullPath);
        removed++;
      }
    }
  }
  return { removed, checkedAt: new Date().toISOString() };
}

module.exports = {
  buildVerticalFilter,
  buildFfmpegArgs,
  queueCloudFfmpegRender,
  cleanupExpiredTempFiles
};
