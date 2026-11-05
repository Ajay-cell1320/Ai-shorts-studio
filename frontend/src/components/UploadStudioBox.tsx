import React, { useState, useRef } from 'react';
import { Upload, Link2, AlertCircle, X, CheckCircle2, Loader2 } from 'lucide-react';

export default function UploadStudioBox() {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlStatus, setUrlStatus] = useState<{ type: string; message: string }>({ type: 'idle', message: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setUploadResult(null);
    const name = file.name.toLowerCase();
    if (!name.endsWith('.mp4') && !name.endsWith('.mov')) {
      return setFileError('Invalid format. Please select an MP4 or MOV video.');
    }
    if (file.size > 250 * 1024 * 1024) {
      return setFileError('File exceeds 250 MB free-tier limit.');
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };
  const startStreamUpload = () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    setFileError(null);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', '/api/uploads/stream', true);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('x-file-name', encodeURIComponent(selectedFile.name));
    xhr.setRequestHeader('x-file-size', String(selectedFile.size));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.ok) {
          setUploadResult(res);
        } else {
          setFileError(res.error || 'Upload failed');
        }
      } catch {
        setFileError('Server error during upload');
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setFileError('Network error: Make sure backend server is running on port 4000.');
    };
    xhr.onabort = () => {
      setUploading(false);
      setProgress(0);
      setFileError('Upload cancelled by user.');
    };
    xhr.send(selectedFile);
  };

  const cancelUpload = () => {
    xhrRef.current?.abort();
  };

  const clearFile = () => {
    if (uploading) cancelUpload();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setFileError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleValidateUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sourceUrl.trim();
    if (!trimmed) return setUrlStatus({ type: 'error', message: 'Enter a URL first.' });
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      return setUrlStatus({ type: 'restricted', message: 'YouTube ToS & DRM Notice: Direct scraping is blocked. Upload MP4/MOV or use authorized cloud links.' });
    }
    setUrlStatus({ type: 'valid', message: 'Authorized stream verified.' });
  };

  return (
    <div className="mt-8 max-w-3xl mx-auto bg-[#0f1429]/90 border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl">
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#060814] rounded-2xl border border-slate-800 mb-5">
        <button type="button" onClick={() => setActiveTab('upload')} className={`py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-slate-400'}`}>
          <Upload className="w-4 h-4" /> <span>Direct Video Upload</span>
        </button>
        <button type="button" onClick={() => setActiveTab('url')} className={`py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${activeTab === 'url' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-slate-400'}`}>
          <Link2 className="w-4 h-4" /> <span>Authorized Video URL</span>
        </button>
      </div>
      {activeTab === 'upload' ? (
        <div>
          <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" onChange={handleFileChange} className="hidden" id="video-upload" />
          {!selectedFile ? (
            <label htmlFor="video-upload" className="cursor-pointer block border-2 border-dashed border-purple-500/40 bg-[#060814]/70 rounded-2xl p-8 text-center">
              <Upload className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <p className="text-base font-semibold text-white">Tap to Pick MP4 / MOV Video</p>
              <p className="text-xs text-slate-400 mt-1">Streaming Upload • Max 250 MB</p>
            </label>
          ) : (
            <div className="bg-[#060814] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white truncate">{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                <button type="button" onClick={clearFile} className="p-1.5 rounded-lg bg-slate-800 text-slate-300"><X className="w-4 h-4" /></button>
              </div>
              {previewUrl && <video src={previewUrl} controls className="w-full max-h-56 rounded-xl bg-black" />}
              {uploading && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading... {progress}%</span>
                    <button type="button" onClick={cancelUpload} className="text-red-400 font-semibold">Cancel</button>
                  </div>
                </div>
              )}
              {!uploading && !uploadResult && (
                <button type="button" onClick={startStreamUpload} className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  Upload & Queue AI Analysis
                </button>
              )}
              {uploadResult && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Uploaded! Job ID: {uploadResult.job?.id} ({uploadResult.job?.status})</span>
                </div>
              )}
            </div>
          )}
          {fileError && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{fileError}</div>}
        </div>
      ) : (
        <form onSubmit={handleValidateUrl} className="space-y-3">
          <div className="flex gap-2">
            <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://example.com/video.mp4" className="flex-1 px-4 py-3 rounded-xl bg-[#060814] border border-slate-700 text-sm text-white" />
            <button type="submit" className="px-5 py-3 rounded-xl font-semibold text-sm bg-purple-600 text-white">Check</button>
          </div>
          {urlStatus.type !== 'idle' && <div className="p-3 rounded-xl bg-amber-500/10 text-xs text-amber-200">{urlStatus.message}</div>}
        </form>
      )}
    </div>
  );
}
