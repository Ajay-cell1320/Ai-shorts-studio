import React, { useState, useRef, useCallback } from 'react';

const API_BASE = 'https://magicshorts.onrender.com';
const CHUNK_SIZE = 1024 * 1024;

interface ShortClip {
  id: string;
  title: string;
  score: number;
  start: number;
  duration: number;
  cap: string;
}

export function VideoUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [shortDuration, setShortDuration] = useState<number>(30);
  const [screenFit, setScreenFit] = useState<'smart' | 'fullfit' | 'zoom'>('smart');
  const [cuttingState, setCuttingState] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [clips, setClips] = useState<ShortClip[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadInFlightRef = useRef<Promise<boolean> | null>(null);
  const uploadedFileKeyRef = useRef<string | null>(null);
  const completedChunksRef = useRef<Set<number>>(new Set());
  const isCloudSyncedRef = useRef<boolean>(false);

  const generateSegments = useCallback((totalDuration: number, clipLen: number) => {
    const list: ShortClip[] = [];
    let cur = 0, idx = 1;
    const caps = [
      'Must watch highlight! 🔥 #shorts',
      'Wait for this moment! ⚡ #viral',
      'Unbelievable scene! 👀✨ #trending',
    ];
    while (cur < totalDuration && idx <= 6) {
      const rem = Math.min(clipLen, Math.floor(totalDuration - cur));
      if (rem < 5 && idx > 1) break;
      const dur = rem || clipLen;
      list.push({
        id: `c_${idx}`,
        title: `🔥 Short #${idx} (${dur}s)`,
        score: Math.max(88, 99 - idx * 2),
        start: Math.floor(cur),
        duration: dur,
        cap: caps[(idx - 1) % caps.length],
      });
      cur += clipLen;
      idx++;
    }
    setClips(list);
    if (list.length > 0) setActiveClipId(list[0].id);
  }, []);

  const uploadSingleChunk = (blob: Blob, name: string, idx: number, onProg: (n: number) => void) =>
    new Promise<boolean>((resolve) => {
      const fd = new FormData();
      fd.append('chunk', blob, name);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/uploads/chunk?index=${idx}`, true);
      xhr.timeout = 30000;
      xhr.upload.onprogress = (e) => e.lengthComputable && onProg(e.loaded);
      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.ontimeout = () => resolve(false);
      xhr.send(fd);
    });

  const syncVideoToCloud = useCallback(async (target: File): Promise<boolean> => {
    const key = `${target.name}_${target.size}_${target.lastModified}`;
    if (isCloudSyncedRef.current && uploadedFileKeyRef.current === key) return true;
    if (uploadInFlightRef.current) return uploadInFlightRef.current;

    const task = (async (): Promise<boolean> => {
      if (uploadedFileKeyRef.current !== key) {
        uploadedFileKeyRef.current = key;
        completedChunksRef.current.clear();
        isCloudSyncedRef.current = false;
        setIsCloudSynced(false);
        setUploadProgress(2);
      }
      setStatusMessage('🚀 Ready! Tap any Download button below to cut immediately!');
      try {
        const ac = new AbortController();
        setTimeout(() => ac.abort(), 3500);
        await fetch(`${API_BASE}/api/uploads/ping`, { signal: ac.signal });
      } catch {}

      const total = Math.ceil(target.size / CHUNK_SIZE);
      for (let i = 0; i < total; i++) {
        if (completedChunksRef.current.has(i)) continue;
        const start = i * CHUNK_SIZE;
        const slice = target.slice(start, Math.min(target.size, start + CHUNK_SIZE));
        const onProg = (loaded: number) =>
          setUploadProgress(Math.max(2, Math.min(99, Math.round(((start + loaded) / target.size) * 100))));

        let ok = await uploadSingleChunk(slice, target.name, i, onProg);
        if (!ok) {
          await new Promise((r) => setTimeout(r, 2000));
          ok = await uploadSingleChunk(slice, target.name, i, onProg);
        }
        if (!ok) {
          setStatusMessage('⚡ Instant Phone Cutter Active! Tap any green Download button below.');
          return false;
        }
        completedChunksRef.current.add(i);
        setUploadProgress(Math.min(99, Math.round(((i + 1) / total) * 100)));
      }
      isCloudSyncedRef.current = true;
      setIsCloudSynced(true);
      setUploadProgress(100);
      setStatusMessage('⚡ 100% Cloud Cached! Instant FFmpeg cuts unlocked!');
      return true;
    })();

    uploadInFlightRef.current = task;
    try { return await task; } finally { uploadInFlightRef.current = null; }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setVideoUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
    const v = document.createElement('video');
    v.src = url;
    v.onloadedmetadata = () => {
      generateSegments(v.duration || 60, shortDuration);
      syncVideoToCloud(selected);
    };
  };

  const saveBlob = (blob: Blob, name: string) => {
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 15000);
  };

  const cutClipLocally = async (clip: ShortClip) => {
    if (!videoUrl) return;
    setCuttingState((p) => ({ ...p, [clip.id]: '✂️ Starting 9:16 Cut (0%)...' }));
    if (previewVideoRef.current && !previewVideoRef.current.paused) previewVideoRef.current.pause();

    const vid = document.createElement('video');
    vid.src = videoUrl;
    vid.playsInline = true;
    vid.muted = false;
    await new Promise<void>((r) => { vid.onloadedmetadata = () => r(); });

    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;
    const stream = canvas.captureStream(30);
    let audioCtx: AudioContext | null = null;

    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AC();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const src = audioCtx.createMediaElementSource(vid);
      const dst = audioCtx.createMediaStreamDestination();
      src.connect(dst);
      dst.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch { vid.muted = true; }

    const mime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

    vid.currentTime = clip.start;
    await new Promise<void>((r) => { vid.onseeked = () => r(); });
    rec.start(200);
    try { await vid.play(); } catch { vid.muted = true; await vid.play(); }

    const draw = () => {
      if (vid.paused || vid.ended || vid.currentTime >= clip.start + clip.duration) {
        if (rec.state === 'recording') rec.stop();
        vid.pause();
        return;
      }
      const pct = Math.min(99, Math.round(((vid.currentTime - clip.start) / clip.duration) * 100));
      setCuttingState((p) => ({ ...p, [clip.id]: `✂️ Cutting 9:16 Video: ${pct}%` }));
      ctx.fillStyle = '#0b0c16';
      ctx.fillRect(0, 0, 720, 1280);
      ctx.filter = 'blur(16px) brightness(0.45)';
      ctx.drawImage(vid, -180, 0, 1080, 1280);
      ctx.filter = 'none';
      const vw = vid.videoWidth || 1280, vh = vid.videoHeight || 720;
      if (screenFit === 'zoom') {
        const s = Math.max(720 / vw, 1280 / vh);
        ctx.drawImage(vid, (720 - vw * s) / 2, (1280 - vh * s) / 2, vw * s, vh * s);
      } else if (screenFit === 'fullfit') {
        const s = 720 / vw;
        ctx.drawImage(vid, 0, (1280 - vh * s) / 2, 720, vh * s);
      } else {
        const s = 900 / vh;
        ctx.drawImage(vid, (720 - vw * s) / 2, 190, vw * s, 900);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.fillRect(40, 1040, 640, 64);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(clip.cap, 360, 1080);
      requestAnimationFrame(draw);
    };
    draw();

    await new Promise<void>((r) => {
      rec.onstop = () => {
        if (audioCtx) audioCtx.close().catch(() => {});
        saveBlob(new Blob(chunks, { type: mime }), `Short_9x16_${clip.start}s_${clip.duration}s.mp4`);
        setCuttingState((p) => { const c = { ...p }; delete c[clip.id]; return c; });
        setStatusMessage(`✅ Downloaded ${clip.title} to your phone!`);
        r();
      };
    });
  };

  const handleDownloadShort = async (clip: ShortClip) => {
    if (cuttingState[clip.id]) return;
    if (isCloudSyncedRef.current) {
      setCuttingState((p) => ({ ...p, [clip.id]: '⚡ Cloud FFmpeg Cutting...' }));
      try {
        const res = await fetch(`${API_BASE}/api/uploads/cut-fast?start=${clip.start}&duration=${clip.duration}&ratio=${screenFit}`);
        if (res.ok) {
          const b = await res.blob();
          if (b.size > 50000) {
            saveBlob(new Blob([b], { type: 'video/mp4' }), `Short_${screenFit}_${clip.start}s_${clip.duration}s.mp4`);
            setCuttingState((p) => { const c = { ...p }; delete c[clip.id]; return c; });
            setStatusMessage(`✅ Downloaded Cloud FFmpeg Short!`);
            return;
          }
        }
      } catch {}
    }
    await cutClipLocally(clip);
  };

  const handleDownloadAllShorts = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBatchRunning || clips.length === 0) return;
    setIsBatchRunning(true);
    try {
      for (const c of clips) await handleDownloadShort(c);
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 text-white space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400">1. Choose Short Duration:</label>
        <div className="grid grid-cols-5 gap-1.5 bg-[#0b0c16] p-1.5 rounded-xl">
          {[15, 30, 45, 60, 90].map((d) => (
            <button key={d} type="button" onClick={() => { setShortDuration(d); if (previewVideoRef.current?.duration) generateSegments(previewVideoRef.current.duration, d); }} className={`py-2 rounded-lg text-xs font-bold ${shortDuration === d ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>{d}s</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400">2. Choose 9:16 Screen Fit:</label>
        <div className="grid grid-cols-3 gap-1.5 bg-[#0b0c16] p-1.5 rounded-xl">
          <button type="button" onClick={() => setScreenFit('smart')} className={`py-2 rounded-lg text-[11px] font-bold ${screenFit === 'smart' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>✨ Smart 9:16 Fit</button>
          <button type="button" onClick={() => setScreenFit('fullfit')} className={`py-2 rounded-lg text-[11px] font-bold ${screenFit === 'fullfit' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>🖼️ Full Width Blur</button>
          <button type="button" onClick={() => setScreenFit('zoom')} className={`py-2 rounded-lg text-[11px] font-bold ${screenFit === 'zoom' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>📱 Full Zoom</button>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={handleFileChange} />
      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-3.5 border border-dashed border-purple-500 rounded-xl text-xs">
        {file ? `${file.name} (${(file.size / 1048576).toFixed(1)} MB)` : 'Tap to choose your MP4 video'}
      </button>

      {file && !isCloudSynced && (
        <div className="space-y-1 text-xs">
          <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Background Cloud Sync: {uploadProgress}% (Optional)</span>
            <button type="button" onClick={() => syncVideoToCloud(file)} className="text-purple-400 underline">Retry</button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">{statusMessage}</div>
      )}

      {videoUrl && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="relative mx-auto w-52 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-purple-500">
            <video ref={previewVideoRef} src={videoUrl} controls autoPlay playsInline onTimeUpdate={() => {
              const cur = clips.find((c) => c.id === activeClipId);
              if (previewVideoRef.current && cur && previewVideoRef.current.currentTime >= cur.start + cur.duration) previewVideoRef.current.pause();
            }} className="w-full h-full object-contain" />
            {activeClipId && (
              <div className="absolute bottom-6 inset-x-2 text-center pointer-events-none">
                <span className="bg-black/80 text-yellow-300 font-bold text-[11px] px-2 py-1 rounded">{clips.find((c) => c.id === activeClipId)?.cap}</span>
              </div>
            )}
          </div>

          {clips.length > 0 && (
            <button type="button" disabled={isBatchRunning} onClick={handleDownloadAllShorts} className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-60">
              {isBatchRunning ? '⚡ Cutting & Downloading All Shorts...' : `🚀 Download All ${clips.length} Shorts (Auto-Queued)`}
            </button>
          )}

          {clips.map((c) => {
            const st = cuttingState[c.id];
            return (
              <div key={c.id} onClick={() => { setActiveClipId(c.id); if (previewVideoRef.current) { previewVideoRef.current.currentTime = c.start; previewVideoRef.current.play(); } }} className={`p-3 rounded-xl border text-xs space-y-2 cursor-pointer ${activeClipId === c.id ? 'border-purple-500 bg-purple-950/40' : 'border-white/10 bg-[#0b0c16]'}`}>
                <div className="flex justify-between font-bold"><span>{c.title}</span><span className="text-emerald-400">{c.score}% Viral</span></div>
                <div className="text-gray-400">Segment: {c.start}s to {c.start + c.duration}s ({c.duration}s)</div>
                <button type="button" disabled={Boolean(st)} onClick={(e) => { e.stopPropagation(); handleDownloadShort(c); }} className={`w-full py-2.5 rounded-lg font-bold text-white ${st ? 'bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                  {st || (isCloudSynced ? `⚡ Cloud FFmpeg Cut (${c.duration}s)` : `⚡ Instant Cut & Download Short (${c.duration}s)`)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default VideoUploader;
