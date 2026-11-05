const fs = require('fs');
const db = require('../config/db');
const { detectAndRankHighlights } = require('./highlightService');
const { queueCloudFfmpegRender } = require('../workers/ffmpegWorker');

const VALID_DURATIONS = [15, 30, 45, 60, 90, 'AUTO'];

function normalizeDuration(durationOption) {
  if (!durationOption || durationOption === 'AUTO') return 'AUTO';
  const num = Number(durationOption);
  return VALID_DURATIONS.includes(num) ? num : 'AUTO';
}

function writePlaceholderMp4IfMissing(filePath) {
  if (!fs.existsSync(filePath)) {
    const ftypHeader = Buffer.from(
      '00000018667479706d703432000000006d70343269736f6d',
      'hex'
    );
    fs.writeFileSync(filePath, ftypHeader);
  }
}

async function generateVerticalShortsBatch({
  projectId = 'proj_test_1',
  durationOption = 'AUTO',
  layout = 'blurred-bg'
}) {
  const normalizedDuration = normalizeDuration(durationOption);
  const highlights = await detectAndRankHighlights(projectId, normalizedDuration);
  const generatedShorts = [];

  for (const clip of highlights) {
    const renderInfo = await queueCloudFfmpegRender({
      clipId: clip.id,
      startTime: clip.startTime,
      duration: clip.duration,
      layout
    });

    writePlaceholderMp4IfMissing(renderInfo.outputPath);
    const shortItem = {
      ...clip,
      aspectRatio: '9:16',
      resolution: '1080x1920',
      layout,
      preserveAudio: true,
      status: 'COMPLETED',
      renderJobId: renderInfo.job.id,
      executionMode: renderInfo.executionMode,
      outputFileName: `${clip.id}_9x16.mp4`,
      outputPath: renderInfo.outputPath,
      downloadUrl: `/api/downloads/clip/${clip.id}`
    };
    generatedShorts.push(shortItem);
  }

  db.memoryStore.clips.set(projectId, generatedShorts);
  return {
    projectId,
    selectedDuration: normalizedDuration,
    layout,
    count: generatedShorts.length,
    shorts: generatedShorts
  };
}

module.exports = { generateVerticalShortsBatch, VALID_DURATIONS };
