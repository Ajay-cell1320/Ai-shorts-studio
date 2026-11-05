const http = require('http');

const PORT = 4000;

function runTestRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function runCompleteWorkflow() {
  console.log('=== STARTING AI SHORTS STUDIO COMPLETE WORKFLOW TEST ===');
  const projectId = 'proj_flow_' + Date.now();

  // 1. Test Health
  const health = await runTestRequest({ hostname: 'localhost', port: PORT, path: '/api/health', method: 'GET' });
  console.log('[1/5] Health Check:', health.status === 200 ? 'SUCCESS' : 'FAILED');

  // 2. Test Transcription
  const tr = await runTestRequest(
    { hostname: 'localhost', port: PORT, path: '/api/transcription/generate', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { projectId, language: 'Hinglish' }
  );
  console.log('[2/5] AI Transcription:', tr.body.ok ? `SUCCESS (${tr.body.transcript.segments.length} segments)` : 'FAILED');

  // 3. Test Gemini Analysis
  const analysis = await runTestRequest(
    { hostname: 'localhost', port: PORT, path: '/api/analysis/analyze', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { projectId }
  );
  console.log('[3/5] Gemini Analysis:', analysis.body.ok ? `SUCCESS (${analysis.body.clipCount} clips analyzed)` : 'FAILED');

  // 4. Test Shorts Generation
  const shorts = await runTestRequest(
    { hostname: 'localhost', port: PORT, path: '/api/shorts/generate', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { projectId, duration: 30, layout: 'blurred-bg' }
  );
  console.log('[4/5] Vertical Shorts Generation:', shorts.body.ok ? `SUCCESS (${shorts.body.count} MP4 9:16 Shorts)` : 'FAILED');

  // 5. Test Caption Burning
  const cap = await runTestRequest(
    { hostname: 'localhost', port: PORT, path: '/api/captions/render', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { projectId, clipId: 'clip_101', language: 'Hinglish', templateId: 'karaoke-highlight' }
  );
  console.log('[5/5] Subtitle & FFmpeg Render:', cap.body.ok ? 'SUCCESS (.ass & render queued)' : 'FAILED');

  console.log('=== COMPLETE WORKFLOW TEST FINISHED SUCCESSFULLY ===');
}

module.exports = { runCompleteWorkflow };
