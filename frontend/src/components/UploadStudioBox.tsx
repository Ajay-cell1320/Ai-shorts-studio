import React, { useState, useRef } from 'react';

const API_BASE = 'https://magicshorts.onrender.com';

export const UploadStudioBox: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [ratioMode, setRatioMode] = useState<'smart' | 'fullfit' | 'zoom'>('smart');
  const [cuttingId, setCuttingId] = useState<string | null>(null);
  const [cutPct, setCutPct] = useState<number>(0);
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
        title: i === 1 ? `🔥 Opening Hook (${actualDur || dur}s)` : i === 2 ? `⚡ Peak Comedy / Action (${actualDur || dur}s)` : `🎯 Climax Scene (${actualDur || dur}s)`,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setServerHasFile(false);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      generateSequentialClips(tempVideo.duration || 60, selectedDuration);
      setStatusMsg('✅ Video ready! Only 1 download at a time is allowed for maximum speed.');
    };
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSingleDownload = async (c: any) => {
    if (!file || cuttingId !== null) return; // Strict 1-at-a-time lock
    setCuttingId(c.id);
    const outFileName = `Short_${ratioMode}_${c.start}s_${c.duration}s.mp4`;

    // 1. If file is already cached on server, cut in 2-4 seconds without re-uploading!
    if (serverHasFile) {
      setCutPct(100);
      setStatusMsg(`⚡ Instant Server Cut (${c.duration}s)... No re-upload needed!`);
      try {
        const res = await fetch(`${API_BASE}/api/uploads/cut-fast?start=${c.start}&duration=${c.duration}&ratio=${ratioMode}`);
        if (res.ok) {
          const blob = await res.blob();
          saveBlob(blob, outFileName);
          setCuttingId(null);
          setStatusMsg('✅ Downloaded in seconds!');
          return;
        }
      } catch {}
    }

    // 2. First download (or if Render restarted): upload once & cut
    setCutPct(1);
    setStatusMsg(`⏳ Uploading once & cutting ${c.duration}s Short... (Next clips will be instant!)`);
    const fd = new FormData();
    fd.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/uploads/cut-direct?start=${c.start}&duration=${c.duration}&ratio=${ratioMode}`, true);
    xhr.responseType = 'blob';

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setCutPct(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      setCuttingId(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        setServerHasFile(true);
        saveBlob(xhr.response, outFileName);
        setStatusMsg('✅ Downloaded! Server cached your video — your next Short download will take only 3 seconds!');
      } else {
        setStatusMsg('❌ Server busy or waking up. Try again in 5 seconds.');
      }
    };

    xhr.onerror = () => {
      setCuttingId(null);
      setStatusMsg('⚠️ Network interrupted. Tap Download again.');
    };

    xhr.send(fd);
  };
  return (
    <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 text-white space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400">1. Choose Short Duration:</label>
        <div className="grid grid-cols-5 gap-1.5 bg-[#0b0c16] p-1.5 rounded-xl">
          {[15, 30, 45, 60, 90].map((sec) => (
            <button key={sec} type="button" disabled={cuttingId !== null} onClick={() => {
              setSelectedDuration(sec);
              if (videoRef.current?.duration) generateSequentialClips(videoRef.current.duration, sec);
            }} className={`py-2 rounded-lg text-xs font-bold ${selectedDuration === sec ? 'bg-purple-600' : 'text-gray-400'} disabled:opacity-40`}>{sec}s</button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400">2. Choose 9:16 Screen Fit:</label>
        <div className="grid grid-cols-3 gap-1.5 bg-[#0b0c16] p-1.5 rounded-xl">
          <button type="button" disabled={cuttingId !== null} onClick={() => setRatioMode('smart')} className={`py-2 rounded-lg text-[11px] font-bold ${ratioMode === 'smart' ? 'bg-purple-600' : 'text-gray-400'}`}>✨ Smart 9:16 Fit</button>
          <button type="button" disabled={cuttingId !== null} onClick={() => setRatioMode('fullfit')} className={`py-2 rounded-lg text-[11px] font-bold ${ratioMode === 'fullfit' ? 'bg-purple-600' : 'text-gray-400'}`}>🖼 Full Width Blur</button>
          <button type="button" disabled={cuttingId !== null} onClick={() => setRatioMode('zoom')} className={`py-2 rounded-lg text-[11px] font-bold ${ratioMode === 'zoom' ? 'bg-purple-600' : 'text-gray-400'}`}>📱 Full Zoom</button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={handleFileSelect} />
      <button type="button" disabled={cuttingId !== null} onClick={() => fileRef.current?.click()} className="w-full py-3.5 border border-dashed border-purple-500 rounded-xl text-xs disabled:opacity-40">
        {file ? `${file.name} (${(file.size / 1048576).toFixed(1)} MB)` : 'Tap to choose your MP4 video'}
      </button>

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

          {clips.map((c) => {
            const isThisCutting = cuttingId === c.id;
            const isOtherCutting = cuttingId !== null && cuttingId !== c.id;
            return (
              <div key={c.id} onClick={() => { if (!cuttingId) { setActiveClip(c); if (videoRef.current) { videoRef.current.currentTime = c.start; videoRef.current.play(); } } }} className={`p-3 rounded-xl border text-xs space-y-2 cursor-pointer ${activeClip?.id === c.id ? 'border-purple-500 bg-purple-950/40' : 'border-white/10 bg-[#0b0c16]'}`}>
                <div className="flex justify-between font-bold">
                  <span>{c.title}</span>
                  <span className="text-emerald-400">{c.score}% Viral</span>
                </div>
                <div className="text-gray-400">Segment: {c.start}s to {c.start + c.duration}s ({c.duration}s)</div>
                <button
                  type="button"
                  disabled={cuttingId !== null}
                  onClick={(e) => { e.stopPropagation(); handleSingleDownload(c); }}
                  className={`w-full py-2.5 rounded-lg font-bold text-center text-white transition ${
                    isThisCutting ? 'bg-amber-600' : isOtherCutting ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {isThisCutting
                    ? `⏳ ${cutPct < 100 ? `Uploading ${cutPct}%...` : 'Fast Cutting 9:16 MP4...'}`
                    : isOtherCutting
                    ? '🔒 Single Download Active — Wait...'
                    : serverHasFile
                    ? `⚡ Instant Cut & Download ${c.duration}s Short (3s)`
                    : `⬇ Cut & Download ${c.duration}s Short`}
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
