import React from 'react';
import { Play, Edit3, Download, Trash2, Sparkles, Clock } from 'lucide-react';
import { ShortClipCandidate } from '../../../shared/types';

interface ShortCardProps {
  clip: ShortClipCandidate;
  onPreview: (clip: ShortClipCandidate) => void;
  onEdit: (clip: ShortClipCandidate) => void;
  onDelete: (id: string) => void;
}

export default function ShortCard({ clip, onPreview, onEdit, onDelete }: ShortCardProps) {
  const handleDownload = () => {
    window.open(`/api/downloads/clip/${clip.id}`, '_blank');
  };

  return (
    <div className="bg-[#0f1429] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
      <div>
        <div className="relative aspect-[9/16] max-h-52 w-full bg-gradient-to-b from-purple-950/60 to-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-3 mb-3 overflow-hidden">
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            {clip.status}
          </span>
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" /> {clip.duration}s
          </span>
          <button onClick={() => onPreview(clip)} className="w-11 h-11 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
          <p className="mt-3 text-[11px] text-center text-slate-300 line-clamp-2 italic">"{clip.transcriptExcerpt}"</p>
        </div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-purple-400 font-semibold">{clip.category}</span>
          <span className="flex items-center gap-1 text-amber-300 font-bold"><Sparkles className="w-3.5 h-3.5" /> Score: {clip.engagementScore}/100</span>
        </div>
        <h3 className="font-bold text-white text-sm line-clamp-1">{clip.title}</h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{clip.hook}</p>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-slate-800/80">
        <button onClick={() => onPreview(clip)} className="py-2 rounded-lg bg-slate-800/90 text-slate-200 text-xs flex flex-col items-center gap-1">
          <Play className="w-3.5 h-3.5 text-blue-400" /> <span>Preview</span>
        </button>
        <button onClick={() => onEdit(clip)} className="py-2 rounded-lg bg-slate-800/90 text-slate-200 text-xs flex flex-col items-center gap-1">
          <Edit3 className="w-3.5 h-3.5 text-purple-400" /> <span>Edit</span>
        </button>
        <button onClick={handleDownload} className="py-2 rounded-lg bg-slate-800/90 text-slate-200 text-xs flex flex-col items-center gap-1">
          <Download className="w-3.5 h-3.5 text-emerald-400" /> <span>MP4</span>
        </button>
        <button onClick={() => onDelete(clip.id)} className="py-2 rounded-lg bg-red-500/10 text-red-300 text-xs flex flex-col items-center gap-1">
          <Trash2 className="w-3.5 h-3.5" /> <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
