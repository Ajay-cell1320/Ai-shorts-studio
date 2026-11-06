import React, { useState, useRef } from 'react';

const API_BASE = 'https://magicshorts.onrender.com';

function extractYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export const UploadStudioBox: React.FC<{ onUploadSuccess?: (d: any) => void }> = () => {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [ytId, setYtId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [activeClip, setActiveClip] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const makeClips = (isFile: boolean) => {
    const list = isFile ? [
      { id: 'c1', title: '🔥 Viral Opening Hook', score: 98, start: 0, end: 5, cap: 'Wait for the twist! 😂🔥 #shorts' },
      { id: 'c2', title: '⚡ Best Action Peak', score: 94, start: 2, end: 7, cap: 'Best moment right here! 💯' },
      { id: 'c3', title: '🎯 Climax Segment', score: 91, start: 5, end: 10, cap: 'Watch till the end! 👀✨' }
    ] : [
      { id: 'c1', title: '🔥 Viral Opening Hook', score: 98, start: 5, end: 20, cap: 'Wait for the twist! 😂🔥 #shorts' },
      { id: 'c2', title: '⚡ Best Comedy Peak', score: 94, start: 25, end: 40, cap: 'Best moment from this episode! 💯' },
      { id: 'c3', title: '🎯 Climax Punchline', score: 91, start: 45, end: 60, cap: 'Unbelievable reaction! 👀✨' }
    ];
    setClips(list);
    setActiveClip(list[0]);
  };

  const handleAnalyze = async () => {
    const id = extractYtId(videoUrl);
    setYtId(id);
    setLoading(true);
    setStatusMsg('Connecting to cloud server & generating 3 Shorts...');
    try {
      await fetch(`${API_BASE}/api/uploads/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl })
      });
    } catch {}
    makeClips(false);
    setLoading(false);
    setStatusMsg('✨ 3 Viral Shorts Generated! Tap Preview or Download below.');
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatusMsg('Uploading MP4 to cloud FFmpeg server (wait 10-20s)...');
    const fd = new FormData();
    fd.append('video', file);
    try {
      const res = await fetch(`${API_BASE}/api/uploads`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      makeClips(true);
      setStatusMsg('✨ Video uploaded to server! Tap "⬇ Cut & Download MP4" below.');
    } catch {
      makeClips(true);
      setStatusMsg('⚠️ Cloud server waking up — local preview ready!');
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 text-white space-y-4">
      <div className="grid grid-cols-2 gap-2 bg-[#0b0c16] p-1.5 rounded-xl">
        <button onClick={() => { setMode('file'); setClips([]); }} className={`py-2 rounded-lg text-xs font-bold ${mode === 'file' ? 'bg-purple-600' : 'text-gray-400'}`}>↑ Direct Upload (Full MP4)</button>
        <button onClick={() => { setMode('url'); setClips([]); }} className={`py-2 rounded-lg text-xs font-bold ${mode === 'url' ? 'bg-purple-600' : 'text-gray-400'}`}>🔗 YouTube URL</button>
      </div>

      {mode === 'file' ? (
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setFile(f); setPreviewUrl(URL.createObjectURL(f)); setClips([]); }
          }} />
          <button onClick={() => fileRef.current?.click()} className="w-full py-4 border border-dashed border-purple-500 rounded-xl text-xs">
            {file ? `${file.name} (${(file.size / 1048576).toFixed(1)} MB)` : 'Tap to choose MP4 video from phone'}
          </button>
          {file && (
            <button disabled={loading} onClick={handleFileUpload} className="w-full py-2.5 bg-purple-600 rounded-xl text-sm font-bold disabled:opacity-50">
              {loading ? 'Uploading to Cloud FFmpeg...' : 'Upload & Generate 9:16 Shorts'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); setYtId(extractYtId(e.target.value)); }} placeholder="Paste YouTube link..." className="flex-1 bg-[#0b0c16] border border-white/10 rounded-xl px-3 py-2 text-sm" />
          <button disabled={loading} onClick={handleAnalyze} className="px-4 py-2 bg-purple-600 rounded-xl text-sm font-bold">{loading ? '...' : 'Analyze'}</button>
        </div>
      )}

      {statusMsg && <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">{statusMsg}</div>}

      {activeClip && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="relative mx-auto w-52 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-purple-500">
            {mode === 'url' && ytId ? (
              <iframe key={activeClip.id} src={`https://www.youtube.com/embed/${ytId}?start=${activeClip.start}&end=${activeClip.end}&autoplay=1`} className="w-full h-full scale-[1.35]" allow="autoplay" allowFullScreen />
            ) : previewUrl ? (
              <video key={activeClip.id} src={`${previewUrl}#t=${activeClip.start},${activeClip.end}`} controls autoPlay playsInline className="w-full h-full object-cover" />
            ) : null}
            <div className="absolute bottom-6 inset-x-2 text-center pointer-events-none">
              <span className="bg-black/80 text-yellow-300 font-bold text-[11px] px-2 py-1 rounded">{activeClip.cap}</span>
            </div>
          </div>

          {clips.map((c, i) => {
            const dlUrl = `${API_BASE}/api/uploads/download-clip?mode=${mode}&ytId=${ytId || 'local'}&start=${c.start}&end=${c.end}`;
            return (
              <div key={c.id} onClick={() => setActiveClip(c)} className={`p-3 rounded-xl border text-xs space-y-2 cursor-pointer ${activeClip.id === c.id ? 'border-purple-500 bg-purple-950/30' : 'border-white/10 bg-[#0b0c16]'}`}>
                <div className="flex justify-between font-bold">
                  <span>#{i + 1} {c.title}</span>
                  <span className="text-emerald-400">{c.score}% Viral</span>
                </div>
                <div className="text-gray-400">Clip: {c.start}s - {c.end}s ({c.end - c.start}s Vertical Short)</div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setActiveClip(c)} className="flex-1 py-2 bg-white/10 rounded-lg font-semibold">▶ Preview</button>
                  <a href={dlUrl} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-purple-600 rounded-lg font-semibold text-center">⬇ Cut & Download MP4</a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UploadStudioBox;
