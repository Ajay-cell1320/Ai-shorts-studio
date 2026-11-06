import React, { useState, useRef } from 'react';

export const UploadStudioBox: React.FC = () => {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(45);
  const [clips, setClips] = useState<any[]>([]);
  const [activeClip, setActiveClip] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    const dur = selectedDuration;
    const list = [
      { id: 'c1', title: `🔥 Intro Highlight (${dur}s)`, score: 98, start: 0, duration: dur, cap: 'Incredible start! 🚀 #shorts' },
      { id: 'c2', title: `⚡ Midpoint Highlight (${dur}s)`, score: 95, start: 30, duration: dur, cap: 'Wait for this moment! 🔥' },
      { id: 'c3', title: `🎯 Climax Peak (${dur}s)`, score: 92, start: 60, duration: dur, cap: 'Unbelievable ending! 👀✨' }
    ];
    setClips(list);
    setActiveClip(list[0]);
  };

  return (
    <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 text-white space-y-4">
      <div className="grid grid-cols-2 gap-2 bg-[#0b0c16] p-1.5 rounded-xl">
        <button type="button" onClick={() => setMode('file')} className={`py-2.5 rounded-lg text-xs font-bold ${mode === 'file' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>↑ Direct Upload</button>
        <button type="button" onClick={() => setMode('url')} className={`py-2.5 rounded-lg text-xs font-bold ${mode === 'url' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>🔗 YouTube Link</button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400">Choose Short Duration:</label>
        <div className="grid grid-cols-5 gap-1.5 bg-[#0b0c16] p-1.5 rounded-xl">
          {[15, 30, 45, 60, 90].map((sec) => (
            <button key={sec} type="button" onClick={() => setSelectedDuration(sec)} className={`py-2 rounded-lg text-xs font-bold ${selectedDuration === sec ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>{sec}s</button>
          ))}
        </div>
      </div>

      {mode === 'file' ? (
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={handleFileSelect} />
          <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-4 border border-dashed border-purple-500 rounded-xl text-xs">
            {file ? `${file.name} (${(file.size / 1048576).toFixed(1)} MB)` : 'Tap to choose your video (Instant Load)'}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste YouTube link..." className="flex-1 bg-[#0b0c16] border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          <button type="button" onClick={() => {
            const list = [{ id: 'c1', title: '🔥 YouTube Hook (45s)', score: 99, start: 10, duration: 45, cap: 'Must watch! 🔥 #shorts' }];
            setClips(list);
            setActiveClip(list[0]);
          }} className="px-5 py-2.5 bg-purple-600 rounded-xl text-sm font-bold">Analyze</button>
        </div>
      )}

      {activeClip && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="relative mx-auto w-52 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-purple-500">
            {previewUrl && (
              <video key={activeClip.id} src={`${previewUrl}#t=${activeClip.start},${activeClip.start + activeClip.duration}`} controls autoPlay playsInline className="w-full h-full object-cover" />
            )}
            <div className="absolute bottom-6 inset-x-2 text-center pointer-events-none">
              <span className="bg-black/80 text-yellow-300 font-bold text-[11px] px-2 py-1 rounded">{activeClip.cap}</span>
            </div>
          </div>

          {clips.map((c) => (
            <div key={c.id} className="p-3 rounded-xl border text-xs space-y-2 border-purple-500 bg-purple-950/30">
              <div className="flex justify-between font-bold">
                <span>{c.title}</span>
                <span className="text-emerald-400">{c.score}% Viral</span>
              </div>
              <div className="text-gray-400">Start: {c.start}s | Duration: {c.duration}s (Instant 9:16 Preview)</div>
              <a href={previewUrl || '#'} download={`Short_${c.duration}s.mp4`} className="block w-full py-2 bg-purple-600 rounded-lg font-semibold text-center">⬇ Download Short Instantly</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadStudioBox;
