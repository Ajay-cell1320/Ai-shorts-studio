const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { transcribeProjectVideo } = require('./transcriptionService');
const { queueCloudFfmpegRender } = require('../workers/ffmpegWorker');

const SUB_DIR = path.join(__dirname, '../../subtitles');
if (!fs.existsSync(SUB_DIR)) {
  fs.mkdirSync(SUB_DIR, { recursive: true });
}

if (!db.memoryStore.subtitles) {
  db.memoryStore.subtitles = new Map();
}

const TEMPLATE_PRESETS = {
  'viral-bold': { fontName: 'Arial Black', fontSize: 64, primaryColor: '&H0000FFFF', outlineColor: '&H00000000', outline: 5, alignment: 2, marginV: 260 },
  'podcast-style': { fontName: 'Roboto', fontSize: 56, primaryColor: '&H00FFFFFF', outlineColor: '&H00000000', outline: 4, alignment: 2, marginV: 240 },
  'documentary': { fontName: 'Georgia', fontSize: 52, primaryColor: '&H00B4E5FF', outlineColor: '&H00000000', outline: 3, alignment: 2, marginV: 200 },
  'minimal-white': { fontName: 'Inter', fontSize: 48, primaryColor: '&H00F8FAFC', outlineColor: '&H001E293B', outline: 2, alignment: 2, marginV: 220 },
  'karaoke-highlight': { fontName: 'Montserrat', fontSize: 62, primaryColor: '&H00F65CF6', outlineColor: '&H00000000', outline: 5, alignment: 5, marginV: 100 },
  'gaming-style': { fontName: 'Impact', fontSize: 66, primaryColor: '&H00FFFF00', outlineColor: '&H00000000', outline: 6, alignment: 2, marginV: 280 }
};

function formatAssTime(seconds = 0) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function buildAssContent(cues, style) {
  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1080',
    'PlayResY: 1920',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Default,${style.fontName},${style.fontSize},${style.primaryColor},${style.outlineColor},&H80000000,-1,0,1,${style.outline},2,${style.alignment},60,60,${style.marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
  ];
  const lines = cues.map((c) => {
    const start = formatAssTime(c.start);
    const end = formatAssTime(c.end);
    const cleanText = String(c.text || '').replace(/\r?\n/g, ' ');
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${cleanText}`;
  });
  return [...header, ...lines].join('\n');
}

async function generateAndBurnCaptions({
  projectId = 'proj_test_1',
  clipId = 'clip_101',
  language = 'Hinglish',
  templateId = 'viral-bold',
  customStyle = {},
  editedCues = null
}) {
  let transcript = db.memoryStore.transcripts?.get(projectId);
  if (!transcript) {
    transcript = await transcribeProjectVideo(projectId, language);
  }
  const basePreset = TEMPLATE_PRESETS[templateId] || TEMPLATE_PRESETS['viral-bold'];
  const mergedStyle = {
    ...basePreset,
    fontSize: Number(customStyle.fontSize || basePreset.fontSize),
    outline: Number(customStyle.outline ?? basePreset.outline),
    alignment: customStyle.position === 'middle' ? 5 : customStyle.position === 'top' ? 8 : 2
  };

  const cues = Array.isArray(editedCues) && editedCues.length > 0
    ? editedCues
    : transcript.segments.map((s) => ({ id: s.id, start: s.start, end: s.end, text: s.text }));

  const assContent = buildAssContent(cues, mergedStyle);
  const assFilePath = path.join(SUB_DIR, `${clipId}_${templateId}.ass`);
  fs.writeFileSync(assFilePath, assContent, 'utf8');

  const renderJob = await queueCloudFfmpegRender({
    clipId,
    startTime: cues[0]?.start || 0,
    duration: 30,
    layout: 'blurred-bg',
    assSubtitlePath: assFilePath
  });

  const record = { clipId, projectId, language, templateId, style: mergedStyle, cues, assFilePath, renderJob };
  db.memoryStore.subtitles.set(clipId, record);
  return record;
}

module.exports = { generateAndBurnCaptions, TEMPLATE_PRESETS };
