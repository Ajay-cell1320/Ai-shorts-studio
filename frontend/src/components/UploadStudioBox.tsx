import React, { useState, useRef } from 'react';

const API_BASE = 'https://magicshorts.onrender.com';
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

export const UploadStudioBox: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [ratioMode, setRatioMode] = useState<'smart' | 'fullfit' | 'zoom'>('smart');
  const [downloadingIds, setDownloadingIds] = useState<Record<string, string>>({});
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
        cap: i === 1 ? 'Must watch highlight! 🔥 #shorts' : i === 2 ? 'Wait for this moment! ⚡ #viral' : 'Unbelievable scene! 👀✨ #trending'
      });
      start += dur;
      i++;
    }
    setClips(generated);
    if (generated.length > 0) setActiveClip(generated[0]);
  };

  const sendChunkWithProgress = (chunkBlob: Blob, fileName: string, index: number, onProgress: (loaded: number) => void) => {
    return new Promise<boolean>((resolve) => {
      const fd = new FormData();
      fd.append('chunk', chunkBlob, fileName);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/uploads/chunk?index=${index}`, true);
      xhr.timeout = 30000;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded);
      };
      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.ontimeout = () => resolve(false);
      xhr.send(fd);
    });
  };

  const uploadInChunks = async (f: File) => {
    setServerHasFile(false);
    setUploadPct(2);
    setStatusMsg('✅ Ready! Tap any green button below to cut & download immediately (no need to wait for cloud sync!)');

    // Non-blocking 3.5-second ping timeout so it NEVER gets stuck on "Waking up cloud server..."
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3500);
      await fetch(`${API_BASE}/api/uploads/ping`, { signal: ctrl.signal });
    } catch {}

    const totalChunks = Math.ceil(f.size / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      const startByte = i * CHUNK_SIZE;
      const endByte = Math.min(f.size, startByte + CHUNK_SIZE);
      const chunkBlob = f.slice(startByte, endByte);

      const ok = await sendChunkWithProgress(chunkBlob, f.name, i, (loaded) => {
        const totalSent = startByte + loaded;
        const pct = Math.max(2, Math.min(99, Math.round((totalSent / f.size) * 100)));
        setUploadPct(pct);
      });

      if (!ok) {
        // Retry once after 2s if Render was still waking up
        await new Promise((r) => setTimeout(r, 2000));
        const okRetry = await sendChunkWithProgress(chunkBlob, f.name, i, () => {});
        if (!okRetry) return;
      }
    }

    setServerHasFile(true);
    setUploadPct(100);
    setStatusMsg('⚡ 100% Cloud Cached! Instant 2-second FFmpeg server cuts unlocked!');
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
    uploadInChunks(f);
  };
  const saveBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  // Cuts 9:16 video on phone in real-time with ZERO server upload wait
  const cutOnPhoneDevice = async (c: any) => {
    if (!previewUrl || downloadingIds[c.id]) return;
    const vid = document.createElement('video');
    vid.src = previewUrl;
    vid.muted = false;
    vid.playsInline = true;
    await new Promise((r) => { vid.onloadedmetadata = r; });

    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;

    const stream = (canvas as any).captureStream(30);
    try {
      const audioCtx = new AudioContext();
      const src = audioCtx.createMediaElementSource(vid);
      const dest = audioCtx.createMediaStreamDestination();
      src.connect(dest);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch {}

    const mime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    vid.currentTime = c.start;
    await new Promise((r) => { vid.onseeked = r; });

    recorder.start(200);
    await vid.play();

    const draw = () => {
      if (vid.paused || vid.ended || vid.currentTime >= c.start + c.duration) {
        if (recorder.state === 'recording') recorder.stop();
        vid.pause();
        return;
      }
      const elapsed = Math.max(0, vid.currentTime - c.start);
      const pct = Math.min(99, Math.round((elapsed / c.duration) * 100));
      setDownloadingIds((prev) => ({ ...prev, [c.id]: `⚡ Cutting 9:16 Video: ${pct}%` }));

      ctx.fillStyle = '#0b0c16';
      ctx.fillRect(0, 0, 720, 1280);
      ctx.filter = 'blur(16px) brightness(0.45)';
      ctx.drawImage(vid, -180, 0, 1080, 1280);
      ctx.filter = 'none';

      const vw = vid.videoWidth || 1280;
      const vh = vid.videoHeight || 720;
      if (ratioMode === 'zoom') {
        const s = Math.max(720 / vw, 1280 / vh);
        ctx.drawImage(vid, (720 - vw * s) / 2, (1280 - vh * s) / 2, vw * s, vh * s);
      } else if (ratioMode === 'fullfit') {
        const s = 720 / vw;
        ctx.drawImage(vid, 0, (1280 - vh * s) / 2, 720, vh * s);
      } else {
        const targetH = 900;
        const s = targetH / vh;
        ctx.drawImage(vid, (720 - vw * s) / 2, (1280 - targetH) / 2, vw * s, targetH);
      }

      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.fillRect(40, 1040, 640, 64);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.cap, 360, 1080);

      requestAnimationFrame(draw);
    };
    draw();

    await new Promise<void>((resolve) => {
      recorder.onstop = () => {
        const outBlob = new Blob(chunks, { type: mime });
        saveBlob(outBlob, `Short_9x16_${c.start}s_${c.duration}s.mp4`);
        setDownloadingIds((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
        setStatusMsg(`✅ Downloaded Short (${c.start}s-${c.start + c.duration}s) to your phone!`);
        resolve();
      };
    });
  };

  const triggerClipDownload = async (c: any) => {
    if (!file || downloadingIds[c.id]) return;
    if (!serverHasFile) {
      return cutOnPhoneDevice(c);
    }
    setDownloadingIds((prev) => ({ ...prev, [c.id]: '⚡ Cloud FFmpeg Cutting...' }));
    try {
      const res = await fetch(`${API_BASE}/api/uploads/cut-fast?start=${c.start}&duration=${c.duration}&ratio=${ratioMode}`);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 5000) {
          saveBlob(new Blob([blob], { type: 'video/mp4' }), `Short_${ratioMode}_${c.start}s_${c.duration}s.mp4`);
          setDownloadingIds((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
          setStatusMsg(`✅ Downloaded Cloud FFmpeg Short!`);
          return;
        }
      }
    } catch {}
    return cutOnPhoneDevice(c);
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
          <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full transition-all" style={{ width: `${uploadPct}%` }} />
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Background Cloud Sync: {uploadPct}% (Optional)</span>
            <button type="button" onClick={() => uploadInChunks(file)} className="text-purple-400 underline">Retry</button>
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

          {clips.map((c) => {
            const busyText = downloadingIds[c.id];
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
                    busyText ? 'bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {busyText ? busyText : serverHasFile ? `⬇ Cloud FFmpeg Cut (${c.duration}s)` : `⚡ Instant Cut & Download ${c.duration}s Short`}
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
