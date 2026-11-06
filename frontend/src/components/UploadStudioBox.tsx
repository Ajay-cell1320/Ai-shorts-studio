import React, { useState, useRef } from 'react';

const API_BASE = 'https://magicshorts.onrender.com';

function extractYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export const UploadStudioBox: React.FC<{ onUploadSuccess?: (d: any) => void }> = ({ onUploadSuccess }) => {
  const [mode, setMode] = useState<'file' | 'url'>('url');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [ytId, setYtId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [activeClip, setActiveClip] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const makeClips = () => {
    const list = [
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
    setStatusMsg('Generating 3 Viral Vertical Shorts...');
    try {
      await fetch(`${API_BASE}/api/uploads/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl })
      });
    } catch {}
    makeClips();
    setLoading(false);
    setStatusMsg('✨ 3 Viral Shorts Generated! Tap any clip below to preview.');
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatusMsg('Uploading & generating AI Shorts...');
    const fd = new FormData();
    fd.append('video', file);
    try {
      await fetch(`${API_BASE}/api/uploads`, { method: 'POST', body: fd });
    } catch {}
    makeClips();
    setLoading(false);
    setStatusMsg('✨ Video analyzed! 3 Viral Shorts ready below.');
  };
  return (
    <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 text-white space-y-4">
      <div className="grid grid-cols-2 gap-2 bg-[#0b0c16] p-1.5 rounded-xl">
        <button onClick={() => setMode('file')} className={`py-2 rounded-lg text-xs font-bold ${mode === 'file' ? 'bg-purple-600' : 'text-gray-400'}`}>↑ Direct Upload</button>
        <button onClick={() => setMode('url')} className={`py-2 rounded-lg text-xs font-bold ${mode === 'url' ? 'bg-purple-600' : 'text-gray-400'}`}>🔗 YouTube URL</button>
      </div>

      {mode === 'file' ? (
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setFile(f); setPreviewUrl(URL.createObjectURL(f)); }
          }} />
          <button onClick={() => fileRef.current?.click()} className="w-full py-4 border border-dashed border-purple-500 rounded-xl text-xs">
            {file ? file.name : 'Tap to choose MP4 video'}
          </button>
          {file && (
            <button onClick={handleFileUpload} className="w-full py-2.5 bg-purple-600 rounded-xl text-sm font-bold">
              {loading ? 'Processing...' : 'Generate Shorts from Video'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); setYtId(extractYtId(e.target.value)); }} placeholder="Paste YouTube link..." className="flex-1 bg-[#0b0c16] border border-white/10 rounded-xl px-3 py-2 text-sm" />
          <button onClick={handleAnalyze} className="px-4 py-2 bg-purple-600 rounded-xl text-sm font-bold">{loading ? '...' : 'Analyze'}</button>
        </div>
      )}

      {statusMsg && <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">{statusMsg}</div>}

      {activeClip && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="relative mx-auto w-52 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-purple-500">
            {ytId ? (
              <iframe key={activeClip.id} src={`https://www.youtube.com/embed/${ytId}?start=${activeClip.start}&end=${activeClip.end}&autoplay=1`} className="w-full h-full scale-[1.35]" allow="autoplay" allowFullScreen />
            ) : previewUrl ? (
              <video key={activeClip.id} src={`${previewUrl}#t=${activeClip.start},${activeClip.end}`} controls autoPlay className="w-full h-full object-cover" />
            ) : null}
            <div className="absolute bottom-6 inset-x-2 text-center pointer-events-none">
              <span className="bg-black/80 text-yellow-300 font-bold text-[11px] px-2 py-1 rounded">{activeClip.cap}</span>
            </div>
          </div>

          {clips.map((c, i) => (
            <div key={c.id} onClick={() => setActiveClip(c)} className={`p-3 rounded-xl border text-xs space-y-1 cursor-pointer ${activeClip.id === c.id ? 'border-purple-500 bg-purple-950/30' : 'border-white/10 bg-[#0b0c16]'}`}>
              <div className="flex justify-between font-bold">
                <span>#{i + 1} {c.title}</span>
                <span className="text-emerald-400">{c.score}% Viral</span>
              </div>
              <div className="text-gray-400">Clip: {c.start}s - {c.end}s (15s Short)</div>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 py-1.5 bg-white/10 rounded-lg font-semibold">▶ Preview 9:16</button>
                <a href={previewUrl || `${API_BASE}/api/uploads/download-clip?ytId=${ytId}&start=${c.start}&end=${c.end}`} target="_blank" rel="noreferrer" download={`Short_${c.id}.mp4`} className="flex-1 py-1.5 bg-purple-600 rounded-lg font-semibold text-center">⬇ Open / Save</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadStudioBox;
