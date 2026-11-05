import React, { useState } from 'react';
import { Sparkles, Type, Wand2, CheckCircle2, Loader2 } from 'lucide-react';
import { ShortClipCandidate, CaptionTemplateId } from '../../../shared/types';
import { CAPTION_TEMPLATES } from './DashboardData';

interface VideoEditorProps {
  clip: ShortClipCandidate;
  language: string;
  onUpdateClip: (updated: ShortClipCandidate) => void;
}

export default function VideoEditorPanel({ clip, language, onUpdateClip }: VideoEditorProps) {
  const [title, setTitle] = useState(clip.title);
  const [hook, setHook] = useState(clip.hook);
  const [description, setDescription] = useState(clip.description);
  const [captionText, setCaptionText] = useState(clip.transcriptExcerpt);
  const [startTime, setStartTime] = useState(clip.startTime);
  const [endTime, setEndTime] = useState(clip.endTime);
  const [templateId, setTemplateId] = useState<CaptionTemplateId>('viral-bold');
  const [fontSize, setFontSize] = useState(58);
  const [textColor, setTextColor] = useState('#fde047');
  const [position, setPosition] = useState<'bottom' | 'middle' | 'top'>('bottom');
  const [rendering, setRendering] = useState(false);
  const [renderMsg, setRenderMsg] = useState('');
  const titleIdeas = [
    clip.title,
    '3 Mistakes Beginners Make With AI Shorts',
    'How to Double Watch Time With Dynamic Captions',
    'The 3-Second Hook Formula Explained',
    'Mobile Content Creation Workflow in Hinglish'
  ];

  const hookIdeas = [
    clip.hook,
    'Wait until you see the second secret...',
    '90% of creators lose viewers in the first 3 seconds.',
    'Do not upload another Short before changing this setting.',
    'Here is how cloud rendering saves your phone battery.'
  ];

  const handleApplyAndRender = async () => {
    setRendering(true);
    setRenderMsg('');
    try {
      const res = await fetch('/api/captions/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: clip.projectId,
          clipId: clip.id,
          language,
          templateId,
          customStyle: { fontSize, position, primaryColor: textColor },
          editedCues: [{ id: 'cue_1', start: Number(startTime), end: Number(endTime), text: captionText }]
        })
      });
      const data = await res.json();
      if (data.ok) {
        onUpdateClip({ ...clip, title, hook, description, startTime, endTime, transcriptExcerpt: captionText });
        setRenderMsg(`Saved & Queued Cloud FFmpeg Job: ${data.renderJob?.job?.id || 'Ready'}`);
      }
    } catch {
      setRenderMsg('Saved locally (Start backend on port 4000 for cloud render).');
    } finally {
      setRendering(false);
    }
  };
  const posClass =
    position === 'top' ? ' justify-start pt-8' : position === 'middle' ? ' justify-center' : ' justify-end pb-10';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-5 flex flex-col items-center bg-[#0f1429] border border-slate-800 rounded-2xl p-4">
        <span className="text-xs font-semibold text-slate-400 mb-3">9:16 Vertical Preview (1080x1920)</span>
        <div className={`relative aspect-[9/16] w-full max-w-[260px] rounded-2xl bg-gradient-to-b from-indigo-950 via-slate-900 to-black border-2 border-slate-700 p-4 flex flex-col items-center ${posClass} overflow-hidden shadow-2xl`}>
          <div className="absolute top-3 left-3 right-3 flex justify-between text-[10px] text-slate-300 bg-black/50 px-2.5 py-1 rounded-lg">
            <span>{startTime}s - {endTime}s</span>
            <span>{templateId}</span>
          </div>
          <div
            style={{ color: textColor, fontSize: `${Math.max(13, Math.round(fontSize / 3.6))}px` }}
            className="text-center font-black bg-black/65 px-3 py-1.5 rounded-xl border border-white/10 shadow-lg leading-snug"
          >
            {captionText}
          </div>
        </div>
      </div>
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-[#0f1429] border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Type className="w-4 h-4 text-purple-400" /> Editable Captions & Styling</h3>
          <textarea value={captionText} onChange={(e) => setCaptionText(e.target.value)} rows={2} className="w-full rounded-xl bg-[#060814] border border-slate-700 p-3 text-xs text-white" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div><label className="text-slate-400 block mb-1">Start (s)</label><input type="number" value={startTime} onChange={(e) => setStartTime(Number(e.target.value))} className="w-full bg-[#060814] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white" /></div>
            <div><label className="text-slate-400 block mb-1">End (s)</label><input type="number" value={endTime} onChange={(e) => setEndTime(Number(e.target.value))} className="w-full bg-[#060814] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white" /></div>
            <div><label className="text-slate-400 block mb-1">Font Size</label><input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full bg-[#060814] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white" /></div>
            <div><label className="text-slate-400 block mb-1">Color</label><input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-8 bg-[#060814] border border-slate-700 rounded-lg" /></div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(['bottom', 'middle', 'top'] as const).map((pos) => (
              <button key={pos} type="button" onClick={() => setPosition(pos)} className={`px-3 py-1 rounded-lg text-xs capitalize ${position === pos ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}`}>Pos: {pos}</button>
            ))}
            {CAPTION_TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => setTemplateId(t.id)} className={`px-2.5 py-1 rounded-lg text-xs ${templateId === t.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>{t.name}</button>
            ))}
          </div>
        </div>

        <div className="bg-[#0f1429] border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Wand2 className="w-4 h-4 text-blue-400" /> AI Title & Hook Generator (Tap to Apply)</h3>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#060814] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold" />
          <div className="flex flex-wrap gap-1.5">
            {titleIdeas.map((t, idx) => (
              <button key={idx} type="button" onClick={() => setTitle(t)} className="text-[11px] bg-slate-900 hover:bg-slate-800 text-purple-300 px-2.5 py-1 rounded-lg border border-slate-800 truncate max-w-full">{t}</button>
            ))}
          </div>
          <input value={hook} onChange={(e) => setHook(e.target.value)} className="w-full bg-[#060814] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200" />
          <div className="flex flex-wrap gap-1.5">
            {hookIdeas.map((h, idx) => (
              <button key={idx} type="button" onClick={() => setHook(h)} className="text-[11px] bg-slate-900 hover:bg-slate-800 text-blue-300 px-2.5 py-1 rounded-lg border border-slate-800 truncate max-w-full">{h}</button>
            ))}
          </div>
          <button type="button" onClick={handleApplyAndRender} disabled={rendering} className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center gap-2">
            {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Save Edits & Re-Render Cloud Subtitles</span>
          </button>
          {renderMsg && <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{renderMsg}</span></div>}
        </div>
      </div>
    </div>
  );
}
