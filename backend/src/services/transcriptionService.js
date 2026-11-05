const fs = require('fs');
const env = require('../config/env');
const db = require('../config/db');

if (!db.memoryStore.transcripts) {
  db.memoryStore.transcripts = new Map();
}

function getFallbackTranscript(projectId, language = 'Hinglish') {
  const segments = [
    {
      id: 'seg_1',
      start: 0.0,
      end: 15.0,
      text: 'Agar aap apne phone se high-retention YouTube Shorts banana chahte hain, toh yeh 3 secrets dhyan se suno.',
      words: [
        { word: 'Agar', start: 0.0, end: 0.8 },
        { word: 'aap', start: 0.8, end: 1.5 },
        { word: 'phone', start: 1.5, end: 2.5 },
        { word: 'se', start: 2.5, end: 3.2 },
        { word: 'Shorts', start: 3.2, end: 4.5 }
      ]
    },
    {
      id: 'seg_2',
      start: 15.0,
      end: 45.0,
      text: 'Sabse pehli galti log yeh karte hain ki pehle 3 seconds mein strong hook nahi rakhte. Audience turant swipe kar deti hai.',
      words: [
        { word: 'Sabse', start: 15.0, end: 16.0 },
        { word: 'pehli', start: 16.0, end: 17.0 },
        { word: 'galti', start: 17.0, end: 18.2 },
        { word: 'hook', start: 18.2, end: 19.5 }
      ]
    },
    {
      id: 'seg_3',
      start: 45.0,
      end: 90.0,
      text: 'Doosra secret hai cloud FFmpeg aur AI captions. Jab har word screen par highlight hota hai, toh watch time double ho jata hai!',
      words: [
        { word: 'Doosra', start: 45.0, end: 46.2 },
        { word: 'secret', start: 46.2, end: 47.5 },
        { word: 'cloud', start: 47.5, end: 48.8 },
        { word: 'captions', start: 48.8, end: 50.5 }
      ]
    }
  ];
  return {
    id: 'tr_' + Date.now(),
    projectId,
    language,
    mode: 'FALLBACK_DEV_TRANSCRIPT',
    durationSeconds: 90,
    fullText: segments.map((s) => s.text).join(' '),
    segments,
    createdAt: new Date().toISOString()
  };
}

async function transcribeProjectVideo(projectId, language = 'Hinglish') {
  const project = db.memoryStore.projects.get(projectId);
  const apiKey = process.env.TRANSCRIPTION_API_KEY;
  const apiUrl = process.env.TRANSCRIPTION_API_URL || 'https://api.groq.com/openai/v1/audio/transcriptions';

  if (env.hasTranscriptionKey && project && project.filePath && fs.existsSync(project.filePath)) {
    try {
      const fileBuffer = fs.readFileSync(project.filePath);
      const form = new FormData();
      form.append('file', new Blob([fileBuffer]), 'video.mp4');
      form.append('model', 'whisper-large-v3');
      form.append('response_format', 'verbose_json');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form
      });
      if (response.ok) {
        const cloudData = await response.json();
        const result = {
          id: 'tr_' + Date.now(),
          projectId,
          language,
          mode: 'CLOUD_WHISPER_API',
          durationSeconds: Math.round(cloudData.duration || 60),
          fullText: cloudData.text || '',
          segments: (cloudData.segments || []).map((s, idx) => ({
            id: `seg_${idx + 1}`,
            start: Number(s.start || 0),
            end: Number(s.end || 0),
            text: (s.text || '').trim(),
            words: s.words || []
          })),
          createdAt: new Date().toISOString()
        };
        db.memoryStore.transcripts.set(projectId, result);
        return result;
      }
    } catch (err) {
      console.warn('[Transcription Cloud Warning]:', err.message);
    }
  }
  const fallback = getFallbackTranscript(projectId, language);
  db.memoryStore.transcripts.set(projectId, fallback);
  return fallback;
}

module.exports = { transcribeProjectVideo };
