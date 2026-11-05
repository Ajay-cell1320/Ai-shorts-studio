const db = require('../config/db');
const { analyzeTranscriptWithGemini } = require('./geminiService');

const HOOK_KEYWORDS = [
  'secret', 'secrets', 'galti', 'mistake', 'mistakes',
  'dhyan', 'hook', 'double', 'watch time', 'turant', 'important', 'tricks'
];

function computeHighlightBoost(text = '') {
  const lower = text.toLowerCase();
  let boost = 0;
  for (const word of HOOK_KEYWORDS) {
    if (lower.includes(word)) boost += 3;
  }
  return Math.min(12, boost);
}

function isOverlapping(clipA, clipB) {
  const start = Math.max(clipA.startTime, clipB.startTime);
  const end = Math.min(clipA.endTime, clipB.endTime);
  const overlap = Math.max(0, end - start);
  const minDuration = Math.min(clipA.duration || 15, clipB.duration || 15);
  return overlap / minDuration > 0.35;
}

function fitClipDuration(clip, targetDuration, maxVideoDuration) {
  if (!targetDuration || targetDuration === 'AUTO') return clip;
  const desired = Number(targetDuration);
  if (isNaN(desired) || desired <= 0) return clip;

  const start = clip.startTime;
  const end = Math.min(maxVideoDuration, start + desired);
  const adjustedStart = end - start < desired ? Math.max(0, end - desired) : start;

  return {
    ...clip,
    startTime: Number(adjustedStart.toFixed(2)),
    endTime: Number(end.toFixed(2)),
    duration: Math.round(end - adjustedStart)
  };
}

async function detectAndRankHighlights(projectId, targetDuration = 'AUTO') {
  let clips = db.memoryStore.clips?.get(projectId);
  if (!clips || clips.length === 0) {
    const analysis = await analyzeTranscriptWithGemini(projectId);
    clips = analysis.clips;
  }
  const transcript = db.memoryStore.transcripts?.get(projectId);
  const maxDuration = transcript?.durationSeconds || 90;

  const scored = clips.map((clip) => {
    const fitted = fitClipDuration(clip, targetDuration, maxDuration);
    const boost = computeHighlightBoost(fitted.transcriptExcerpt + ' ' + fitted.hook);
    return {
      ...fitted,
      engagementScore: Math.min(98, fitted.engagementScore + boost)
    };
  });

  scored.sort((a, b) => b.engagementScore - a.engagementScore);

  const deduplicated = [];
  for (const candidate of scored) {
    const hasDuplicate = deduplicated.some((existing) => isOverlapping(existing, candidate));
    if (!hasDuplicate) {
      deduplicated.push({ ...candidate, rank: deduplicated.length + 1 });
    }
  }

  db.memoryStore.clips.set(projectId, deduplicated);
  return deduplicated;
}

module.exports = { detectAndRankHighlights };
