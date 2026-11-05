const env = require('../config/env');
const db = require('../config/db');
const { transcribeProjectVideo } = require('./transcriptionService');

function validateAndClampClips(rawClips, transcript, projectId) {
  const maxDuration = transcript.durationSeconds || 90;
  return (rawClips || []).map((c, idx) => {
    const seg = transcript.segments[idx % transcript.segments.length] || { start: 0, end: 15, text: '' };
    const start = Math.max(0, Math.min(Number(c.startTime ?? seg.start), maxDuration - 5));
    const end = Math.max(start + 5, Math.min(Number(c.endTime ?? seg.end), maxDuration));
    return {
      id: `clip_${Date.now()}_${idx + 1}`,
      projectId,
      startTime: start,
      endTime: end,
      duration: Math.round(end - start),
      title: c.title || `Highlight Clip #${idx + 1}`,
      hook: c.hook || 'Watch this key moment from the video.',
      description: c.description || 'AI-selected segment based on transcript pacing.',
      category: c.category || 'Educational',
      engagementScore: Math.min(99, Math.max(50, Number(c.engagementScore || 82))),
      viralityDisclaimer: 'Heuristic score based on hook and pacing; does not guarantee virality.',
      transcriptExcerpt: c.transcriptExcerpt || seg.text,
      titleSuggestions: c.titleSuggestions || [
        c.title || '3 Secrets for Better Shorts',
        'Why Most Creators Miss This Hook Trick',
        'How to Double Retention With Captions',
        'Mobile Content Creation Workflow Explained',
        'Stop Making This Editing Mistake'
      ],
      hookSuggestions: c.hookSuggestions || [
        c.hook || 'Wait until you hear the second tip...',
        '90% of beginners get this wrong in the first 3 seconds.',
        'Here is the fastest way to edit vertical videos.',
        'Do not scroll past if you make YouTube Shorts.',
        'This one change improved watch time immediately.'
      ],
      descriptionSuggestions: c.descriptionSuggestions || [
        'Full breakdown of how hooks and captions improve retention.',
        'Actionable tips for mobile video creators in Hindi and English.',
        'Step-by-step guide extracted automatically with AI Shorts Studio.'
      ],
      hashtags: c.hashtags || ['#YouTubeShorts', '#ContentCreator', '#AIShorts', '#Hinglish'],
      keywords: c.keywords || ['shorts retention', 'video hooks', 'auto captions'],
      status: 'ANALYZED'
    };
  });
}

async function analyzeTranscriptWithGemini(projectId) {
  let transcript = db.memoryStore.transcripts?.get(projectId);
  if (!transcript) {
    transcript = await transcribeProjectVideo(projectId, 'Hinglish');
  }

  if (env.hasGeminiKey) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = `Analyze these exact transcript segments and return a JSON array of candidate Shorts. Use ONLY timestamps within the provided segments. Never invent timestamps. Segments: ${JSON.stringify(transcript.segments)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const parsed = JSON.parse(rawText);
        const clips = validateAndClampClips(Array.isArray(parsed) ? parsed : parsed.clips, transcript, projectId);
        db.memoryStore.clips.set(projectId, clips);
        return { mode: 'CLOUD_GEMINI_API', clips };
      }
    } catch (err) {
      console.warn('[Gemini API Warning]:', err.message);
    }
  }

  const fallbackRaw = transcript.segments.map((seg, i) => ({
    startTime: seg.start,
    endTime: seg.end,
    title: i === 0 ? '3 Secrets for High-Retention Shorts' : i === 1 ? 'The 3-Second Hook Mistake' : 'Why Cloud Captions Double Watch Time',
    hook: seg.text.slice(0, 65) + '...',
    category: i === 0 ? 'Educational' : i === 1 ? 'High-Impact' : 'Insight',
    engagementScore: 92 - i * 4,
    transcriptExcerpt: seg.text
  }));

  const clips = validateAndClampClips(fallbackRaw, transcript, projectId);
  db.memoryStore.clips.set(projectId, clips);
  return { mode: 'FALLBACK_RULE_ANALYZER', clips };
}

module.exports = { analyzeTranscriptWithGemini };
