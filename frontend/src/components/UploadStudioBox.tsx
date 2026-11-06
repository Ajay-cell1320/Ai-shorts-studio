import React, { useState, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://magicshorts.onrender.com';

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export const UploadStudioBox: React.FC<{ onUploadSuccess?: (data: any) => void }> = ({ onUploadSuccess }) => {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [ytId, setYtId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setStatusMsg(null);
  };

  const handleUrlCheck = async () => {
    const clean = videoUrl.trim();
    if (!clean) {
      setStatusMsg({ type: 'err', text: 'Please paste a valid YouTube or video URL.' });
      return;
    }
    const detectedYt = extractYouTubeId(clean);
    setYtId(detectedYt);
    setLoading(true);
    setStatusMsg({ type: 'ok', text: detectedYt ? `Connecting YouTube video (${detectedYt})...` : 'Checking video URL...' });

    try {
      const res = await fetch(`${API_BASE}/api/uploads/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean, videoUrl: clean })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to queue URL');
      setStatusMsg({ type: 'ok', text: data.message || 'YouTube video queued for AI Shorts analysis!' });
      if (onUploadSuccess) onUploadSuccess(data);
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Server error while connecting URL' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = () => {
    if (!file) return;
    setLoading(true);
    setProgress(5);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/uploads`, true);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      setLoading(false);
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
          setStatusMsg({ type: 'ok', text: data.message || 'Video uploaded & queued for AI analysis!' });
          if (onUploadSuccess) onUploadSuccess(data);
        } else {
          setStatusMsg({ type: 'err', text: data.error || 'Server error during upload' });
        }
      } catch {
        setStatusMsg({ type: 'err', text: 'Server error during upload' });
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      setStatusMsg({ type: 'err', text: 'Network error communicating with backend server' });
    };

    xhr.send(formData);
  };

  return (
    <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 text-white space-y-4">
      <div className="grid grid-cols-2 gap-2 bg-[#0b0c16] p-1.5 rounded-xl">
        <button
          type="button"
          onClick={() => { setMode('file'); setStatusMsg(null); }}
          className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition ${mode === 'file' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-gray-400'}`}
        >
          ↑ Direct Video Upload
        </button>
        <button
          type="button"
          onClick={() => { setMode('url'); setStatusMsg(null); }}
          className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition ${mode === 'url' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-gray-400'}`}
        >
          🔗 Authorized Video URL
        </button>
      </div>

      {mode === 'file' ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-500/40 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 transition"
            >
              <p className="text-sm font-medium text-gray-200">Tap to select MP4 / MOV video from device</p>
              <p className="text-xs text-gray-400 mt-1">Supports up to 100MB • Direct Cloud Processing</p>
            </div>
          ) : (
            <div className="space-y-3 bg-[#0b0c16] p-3 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span className="truncate max-w-[80%]">{file.name}</span>
                <button type="button" onClick={() => { setFile(null); setPreviewUrl(null); }} className="text-gray-400 hover:text-white px-2">✕</button>
              </div>
              {previewUrl && (
                <video src={previewUrl} controls className="w-full max-h-52 rounded-lg bg-black" />
              )}
              {loading && (
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={handleFileUpload}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-95 disabled:opacity-50"
              >
                {loading ? `Uploading (${progress}%)...` : 'Upload & Queue AI Analysis'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setYtId(extractYouTubeId(e.target.value));
              }}
              placeholder="Paste YouTube (youtu.be / watch?v=) or MP4 link..."
              className="flex-1 bg-[#0b0c16] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              disabled={loading}
              onClick={handleUrlCheck}
              className="px-5 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-sm"
            >
              {loading ? '...' : 'Analyze'}
            </button>
          </div>

          {ytId && (
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title="YouTube preview"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-medium border ${
          statusMsg.type === 'ok'
            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
        }`}>
          {statusMsg.text}
        </div>
      )}
    </div>
  );
};

export default UploadStudioBox;
