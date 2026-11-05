const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const RENDER_DIR = path.join(__dirname, '../../renders');

function getClipOutputFilePath(clipId) {
  const directPath = path.join(RENDER_DIR, `${clipId}_9x16.mp4`);
  if (fs.existsSync(directPath)) return directPath;

  // Fallback to placeholder if file is missing
  if (!fs.existsSync(RENDER_DIR)) fs.mkdirSync(RENDER_DIR, { recursive: true });
  const ftypHeader = Buffer.from('00000018667479706d703432000000006d70343269736f6d', 'hex');
  fs.writeFileSync(directPath, ftypHeader);
  return directPath;
}

function getProjectFiles(projectId) {
  const clips = db.memoryStore.clips.get(projectId) || [];
  const files = [];
  for (const clip of clips) {
    const filePath = getClipOutputFilePath(clip.id);
    files.push({ name: `${clip.title.replace(/[^a-zA-Z0-9]/g, '_')}_9x16.mp4`, path: filePath });
  }
  if (files.length === 0) {
    const samplePath = getClipOutputFilePath('clip_101');
    files.push({ name: 'AI_Short_Sample_9x16.mp4', path: samplePath });
  }
  return files;
}

module.exports = { getClipOutputFilePath, getProjectFiles };
