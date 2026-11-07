import React, { useState, useRef } from 'react';

const API_BASE = 'https://magicshorts.onrender.com';

export const UploadStudioBox: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [ratioMode, setRatioMode] = useState<'smart' | 'fullfit' | 'zoom'>('smart');
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [serverHasFile, setServerHasFile] = useState<boolean>(false);
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
        title: `🔥 Short #${i} (${actualDur || dur}s)`,
        score: Math.max(88, 99 - i * 2),
        start: Math.floor(start),
        duration: actualDur || dur,
        cap: i === 1 ? 'Diwali pe har saal aisa hota hai! 😂🔥 #shorts' : i === 2 ? 'Kachua hai wo! 😂🐢 #viral' : 'Wait for the end! 👀✨ #trending'
      });
      start += dur;
      i++;
    }
    setClips(generated);
    if (generated.length > 0) setActiveClip(generated[0]);
  };

  const uploadOnceInBackground = (f: File) => {
    setServerHasFile(false);
    setUploadPct(1);
    setStatusMsg('⏳ Uploading video once in background... Once at 100%, all downloads are instant!');
    const fd = new FormData();
    fd.append('video', f);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/uploads`, true);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setServerHasFile(true);
        setUploadPct(100);
        setStatusMsg('⚡ Video Cached on Server! You can now download multiple Shorts at the same time!');
      }
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
    uploadOnceInBackground(f);
  };

  const triggerClipDownload = async (c: any) => {
    if (!file) return;
    setDownloadingIds((prev) => ({ ...prev, [c.id]: true }));
    const outFileName = `Short_${ratioMode}_${c.start}s_${c.duration}s.mp4`;

    try {
      // Fast GET cut (no re-upload!)
      const res = await fetch(`${API_BASE}/api/uploads/cut-fast?start=${c.start}&duration=${c.duration}&ratio=${ratioMode}`);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = outFileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setDownloadingIds((prev) => ({ ...prev, [c.id]: false }));
        return;
      }
    } catch {}

    // Fallback if server restarted
    const fd = new FormData();
    fd.append('video', file);
    const res2 = await fetch(`${API_BASE}/api/uploads/cut-direct?start=${c.start}&duration=${c.duration}&ratio=${ratioMode}`, {
      method: 'POST',
      body: fd
    });
    if (res2.ok) {
      setServerHasFile(true);
      const blob = await res2.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = outFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setDownloadingIds((prev) => ({ ...prev, [c.id]: false }));
  };

  const handleDownloadAll = () => {
    clips.forEach((c, idx) => {
      setTimeout(() => triggerClipDownload(c), idx * 600);
    });
  };
  return (
    <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 text-white space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400">1. Choose Short Duration:</label>
        <div className="grid grid-cols-5 gap-1.5 bg-[#0b0c16] p-1.5 rounded-xl">
          {[15, 30, 45, 60, 90].map((sec) => (
            <button key={sec} type="button" onClick={() => {
              setSelectedDuration(sec);
              if (videoRef.current?.duration) generateSequentialClips(videoRef.current.duration, sec);
            }} className={`py-2 rounded-lg text-xs font-bold ${selectedDuration === sec ? 'bg-purple-600' : 'text-gray-400'}`}>{sec}s</button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400">2. Choose 9:16 Screen Fit:</label>
        <div className="grid grid-cols-3 gap-1.5 bg-[#0b0c16] p-1.5 rounded-xl">
          <button type="button" onClick={() => setRatioMode('smart')} className={`py-2 rounded-lg text-[11px] font-bold ${ratioMode === 'smart' ? 'bg-purple-600' : 'text-gray-400'}`}>✨ Smart 9:16 Fit</button>
          <button type="button" onClick={() => setRatioMode('fullfit')} className={`py-2 rounded-lg text-[11px] font-bold ${ratioMode === 'fullfit' ? 'bg-purple-600' : 'text-gray-400'}`}>🖼 Full Width Blur</button>
          <button type="button" onClick={() => setRatioMode('zoom')} className={`py-2 rounded-lg text-[11px] font-bold ${ratioMode === 'zoom' ? 'bg-purple-600' : 'text-gray-400'}`}>📱 Full Zoom</button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={handleFileSelect} />
      <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-3.5 border border-dashed border-purple-500 rounded-xl text-xs">
        {file ? `${file.name} (${(file.size / 1048576).toFixed(1)} MB)` : 'Tap to choose your MP4 video'}
      </button>

      {file && !serverHasFile && (
        <div className="space-y-1 text-xs">
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full transition-all" style={{ width: `${uploadPct}%` }} />
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Background Server Cache: {uploadPct}%</span>
            <button type="button" onClick={() => uploadOnceInBackground(file)} className="text-purple-400 underline">Retry</button>
          </div>
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

          <button
            type="button"
            onClick={handleDownloadAll}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-xs font-extrabold shadow-lg"
          >
            🚀 Download All {clips.length} Shorts Simultaneously
          </button>

          {clips.map((c) => {
            const isBusy = !!downloadingIds[c.id];
            return (
              <div key={c.id} onClick={() => { setActiveClip(c); if (videoRef.current) { videoRef.current.currentTime = c.start; videoRef.current.play(); } }} className={`p-3 rounded-xl border text-xs space-y-2 cursor-pointer ${activeClip?.id === c.id ? 'border-purple-500 bg-purple-950/40' : 'border-white/10 bg-[#0b0c16]'}`}>
                <div className="flex justify-between font-bold">
                  <span>{c.title}</span>
                  <span className="text-emerald-400">{c.score}% Viral</span>
                </div>
                <div className="text-gray-400">Segment: {c.start}s to {c.start + c.duration}s ({c.duration}s)</div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); triggerClipDownload(c); }}
                  className={`w-full py-2.5 rounded-lg font-bold text-center text-white transition ${
                    isBusy ? 'bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {isBusy ? '⚡ Cutting & Downloading...' : `⬇ Fast Download ${c.duration}s Short (${ratioMode.toUpperCase()})`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UploadStudioBox;
