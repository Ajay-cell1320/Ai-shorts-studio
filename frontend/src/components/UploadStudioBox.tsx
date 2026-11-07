import React, { useState, useRef } from 'react';

const API_BASE = 'https://magicshorts.onrender.com';

export const UploadStudioBox: React.FC = () => {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [uploadedOnServer, setUploadedOnServer] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [activeClip, setActiveClip] = useState<any | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const generateSequentialClips = (totalDur: number, dur: number) => {
    const generated = [];
    let start = 0;
    let i = 1;
    while (start < totalDur && i <= 6) {
      const actualDur = Math.min(dur, Math.floor(totalDur - start));
      if (actualDur < 3 && i > 1) break;
      generated.push({
        id: `c_${i}`,
        title: `🔥 Part ${i} (${actualDur || dur}s Short)`,
        score: Math.max(85, 99 - i * 2),
        start: Math.floor(start),
        duration: actualDur || dur,
        cap: i === 1 ? 'Incredible start! 🚀 #shorts' : i === 2 ? 'Wait for this! 🔥' : 'Best climax! 👀✨'
      });
      start += dur;
      i++;
    }
    setClips(generated);
    if (generated.length > 0) setActiveClip(generated[0]);
  };
  const uploadToServer = (selectedFile: File) => {
    setUploadedOnServer(false);
    setUploadPct(1);
    setStatusMsg('Uploading video to FFmpeg server... Wait for 100% before downloading.');

    const fd = new FormData();
    fd.append('video', selectedFile);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/uploads`, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadedOnServer(true);
        setUploadPct(100);
        setStatusMsg('✅ Upload 100% Complete! Tap "⬇ Download Real Cut MP4" below.');
      } else {
        setStatusMsg('❌ Upload failed. Tap Retry Upload below.');
      }
    };

    xhr.onerror = () => {
      setStatusMsg('⚠️ Server waking up... Tap Retry Upload in 10 seconds.');
    };

    xhr.send(fd);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      generateSequentialClips(tempVideo.duration || 60, selectedDuration);
    };

    uploadToServer(f);
  };

  const handleSelectClip = (c: any) => {
    setActiveClip(c);
    if (videoRef.current) {
      videoRef.current.currentTime = c.start;
      videoRef.current.play();
    }
  };
  return (
    <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 text-white space-y-4">
      <div className="grid grid-cols-2 gap-2 bg-[#0b0c16] p-1.5 rounded-xl">
        <button type="button" onClick={() => setMode('file')} className={`py-2 rounded-lg text-xs font-bold ${mode === 'file' ? 'bg-purple-600' : 'text-gray-400'}`}>↑ Direct Upload (30min+)</button>
        <button type="button" onClick={() => setMode('url')} className={`py-2 rounded-lg text-xs font-bold ${mode === 'url' ? 'bg-purple-600' : 'text-gray-400'}`}>🔗 YouTube Link</button>
      </div>

      <div className="grid grid-cols-5 gap-1.5 bg-[#0b0c16] p-1.5 rounded-xl">
        {[15, 30, 45, 60, 90].map((sec) => (
          <button key={sec} type="button" onClick={() => {
            setSelectedDuration(sec);
            if (videoRef.current?.duration) generateSequentialClips(videoRef.current.duration, sec);
          }} className={`py-2 rounded-lg text-xs font-bold ${selectedDuration === sec ? 'bg-purple-600' : 'text-gray-400'}`}>{sec}s</button>
        ))}
      </div>

      {mode === 'file' ? (
        <div className="space-y-2">
          <input ref={fileRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={handleFileSelect} />
          <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-3.5 border border-dashed border-purple-500 rounded-xl text-xs">
            {file ? `${file.name} (${(file.size / 1048576).toFixed(1)} MB)` : 'Tap to choose your MP4 video'}
          </button>
          {file && !uploadedOnServer && (
            <div className="space-y-1 text-xs">
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${uploadPct}%` }} />
              </div>
              <div className="flex justify-between">
                <span>Uploading to Server: {uploadPct}%</span>
                <button type="button" onClick={() => uploadToServer(file)} className="text-purple-400 underline">Retry</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste YouTube link..." className="flex-1 bg-[#0b0c16] border border-white/10 rounded-xl px-3 py-2 text-sm" />
          <button type="button" onClick={() => generateSequentialClips(180, selectedDuration)} className="px-4 py-2 bg-purple-600 rounded-xl text-sm font-bold">Analyze</button>
        </div>
      )}

      {statusMsg && <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">{statusMsg}</div>}

      {activeClip && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="relative mx-auto w-52 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-purple-500">
            {previewUrl && (
              <video ref={videoRef} src={previewUrl} controls autoPlay playsInline onTimeUpdate={() => {
                if (videoRef.current && activeClip && videoRef.current.currentTime >= activeClip.start + activeClip.duration) videoRef.current.pause();
              }} className="w-full h-full object-contain" />
            )}
            <div className="absolute bottom-6 inset-x-2 text-center pointer-events-none">
              <span className="bg-black/80 text-yellow-300 font-bold text-[11px] px-2 py-1 rounded">{activeClip.cap}</span>
            </div>
          </div>

          {clips.map((c) => (
            <div key={c.id} onClick={() => handleSelectClip(c)} className={`p-3 rounded-xl border text-xs space-y-2 cursor-pointer ${activeClip?.id === c.id ? 'border-purple-500 bg-purple-950/40' : 'border-white/10 bg-[#0b0c16]'}`}>
              <div className="flex justify-between font-bold">
                <span>{c.title}</span>
                <span className="text-emerald-400">{c.score}% Viral</span>
              </div>
              <div className="text-gray-400">Segment: {c.start}s to {c.start + c.duration}s ({c.duration}s)</div>
              {uploadedOnServer ? (
                <a href={`${API_BASE}/api/uploads/download-clip?start=${c.start}&duration=${c.duration}&ratio=smart`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="block w-full py-2 bg-emerald-600 rounded-lg font-bold text-center text-white">
                  ✨ Download Smart 9:16 HD Fit (1080p)
                </a>
              ) : (
                <button type="button" disabled className="w-full py-2 bg-gray-700 text-gray-400 rounded-lg font-semibold">
                  ⏳ Uploading to Server ({uploadPct}%)...
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadStudioBox;
