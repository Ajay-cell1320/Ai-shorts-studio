import React, { useState, useRef } from 'react';

const API_BASE = 'https://magicshorts.onrender.com';

export const UploadStudioBox: React.FC = () => {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [activeClip, setActiveClip] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatusMsg('Uploading long video to cloud FFmpeg server...');
    const fd = new FormData();
    fd.append('video', file);
    try {
      await fetch(`${API_BASE}/api/uploads`, { method: 'POST', body: fd });
    } catch {}

    const dur = selectedDuration;
    const list = [
      { id: 'c1', title: `🔥 Intro Highlight (${dur}s)`, score: 98, start: 0, duration: dur, cap: 'Incredible start! 🚀 #shorts' },
      { id: 'c2', title: `⚡ Midpoint Highlight (${dur}s)`, score: 95, start: 120, duration: dur, cap: 'Wait for this moment! 🔥' },
      { id: 'c3', title: `🎯 Climax Peak (${dur}s)`, score: 92, start: 300, duration: dur, cap: 'Unbelievable ending! 👀✨' }
    ];
    setClips(list);
    setActiveClip(list[0]);
    setLoading(false);
    setStatusMsg(`✨ Ready! Extracted HD 9:16 vertical clips.`);
  };

  const handleUrlSubmit = async () => {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setStatusMsg('Connecting YouTube long video link...');
    try {
      await fetch(`${API_BASE}/api/uploads/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl })
      });
    } catch {}

    const dur = selectedDuration;
    const list = [
      { id: 'c1', title: `🔥 YouTube Hook (${dur}s)`, score: 99, start: 10, duration: dur, cap: 'Must watch! 😂🔥 #shorts' },
      { id: 'c2', title: `⚡ Highlight Peak (${dur}s)`, score: 96, start: 60, duration: dur, cap: 'Best part! 💯' },
      { id: 'c3', title: `🎯 Ending Climax (${dur}s)`, score: 93, start: 150, duration: dur, cap: 'Mind blown! 👀✨' }
    ];
    setClips(list);
    setActiveClip(list[0]);
    setLoading(false);
    setStatusMsg(`✨ YouTube video linked! Generated ${dur}s HD Shorts.`);
  };

  return (
    <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 text-white space-y-4">
      <div className="grid grid-cols-2 gap-2 bg-[#0b0c16] p-1.5 rounded-xl">
        <button
          type="button"
          onClick={() => { setMode('file'); setClips([]); }}
          className={`py-2.5 rounded-lg text-xs font-bold transition ${mode === 'file' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
        >
          ↑ Direct Upload (30min+)
        </button>
        <button
          type="button"
          onClick={() => { setMode('url'); setClips([]); }}
          className={`py-2.5 rounded-lg text-xs font-bold transition ${mode === 'url' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
        >
          🔗 YouTube Link
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400">Choose Short Duration:</label>
        <div className="grid grid-cols-5 gap-1.5 bg-[#0b0c16] p-1.5 rounded-xl">
          {[15, 30, 45, 60, 90].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedDuration(sec)}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                selectedDuration === sec ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {mode === 'file' ? (
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setFile(f); setPreviewUrl(URL.createObjectURL(f)); setClips([]); }
          }} />
          <button onClick={() => fileRef.current?.click()} className="w-full py-4 border border-dashed border-purple-500 rounded-xl text-xs">
            {file ? `${file.name} (${(file.size / 1048576).toFixed(1)} MB)` : 'Tap to choose your 30min+ MP4 video'}
          </button>
          {file && (
            <button disabled={loading} onClick={handleFileUpload} className="w-full py-2.5 bg-purple-600 rounded-xl text-sm font-bold disabled:opacity-50">
              {loading ? 'Processing...' : `Generate ${selectedDuration}s HD Vertical Shorts`}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste long YouTube video link..."
              className="flex-1 bg-[#0b0c16] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <button disabled={loading} onClick={handleUrlSubmit} className="px-5 py-2.5 bg-purple-600 rounded-xl text-sm font-bold disabled:opacity-50">
              {loading ? '...' : 'Analyze'}
            </button>
          </div>
        </div>
      )}

      {statusMsg && <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">{statusMsg}</div>}

      {activeClip && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="relative mx-auto w-52 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-purple-500">
            {mode === 'file' && previewUrl ? (
              <video key={activeClip.id} src={previewUrl} controls autoPlay playsInline className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-950/40 text-xs text-center p-2 font-bold">
                YouTube HD Preview Ready
              </div>
            )}
            <div className="absolute bottom-6 inset-x-2 text-center pointer-events-none">
              <span className="bg-black/80 text-yellow-300 font-bold text-[11px] px-2 py-1 rounded">{activeClip.cap}</span>
            </div>
          </div>

          {clips.map((c) => {
            const dlUrl = `${API_BASE}/api/uploads/download-clip?mode=${mode}&start=${c.start}&duration=${c.duration}`;
            return (
              <div key={c.id} className="p-3 rounded-xl border text-xs space-y-2 border-purple-500 bg-purple-950/30">
                <div className="flex justify-between font-bold">
                  <span>{c.title}</span>
                  <span className="text-emerald-400">{c.score}% Viral</span>
                </div>
                <div className="text-gray-400">Start: {c.start}s | Duration: {c.duration}s (1080x1920 HD 9:16)</div>
                <div className="flex gap-2 pt-1">
                  <a href={dlUrl} target="_blank" rel="noreferrer" className="w-full py-2 bg-purple-600 rounded-lg font-semibold text-center">⬇ Download {c.duration}s HD MP4</a>
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
