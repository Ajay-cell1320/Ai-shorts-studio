import React, { useState } from 'react';
import {
  LayoutDashboard, PlusCircle, FolderKanban, Sliders,
  Captions, Settings, CreditCard, Scissors, Archive, ArrowLeft
} from 'lucide-react';
import { ShortClipCandidate, ShortDurationOption } from '../../../shared/types';
import { CAPTION_TEMPLATES, SAMPLE_CLIPS, DashboardSection } from '../components/DashboardData';
import ShortCard from '../components/ShortCard';
import UploadStudioBox from '../components/UploadStudioBox';
import VideoEditorPanel from '../components/VideoEditorPanel';

export default function DashboardPage({ onBackToLanding }: { onBackToLanding: () => void }) {
  const [section, setSection] = useState<DashboardSection>('dashboard');
  const [clips, setClips] = useState<ShortClipCandidate[]>(SAMPLE_CLIPS);
  const [selectedClip, setSelectedClip] = useState<ShortClipCandidate>(SAMPLE_CLIPS[0]);
  const [duration, setDuration] = useState<ShortDurationOption>('AUTO');
  const [activeTemplate, setActiveTemplate] = useState(CAPTION_TEMPLATES[0].id);
  const [language, setLanguage] = useState<'Hinglish' | 'Hindi' | 'English'>('Hinglish');

  const navItems: { id: DashboardSection; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Shorts', icon: PlusCircle },
    { id: 'projects', label: 'My Projects', icon: FolderKanban },
    { id: 'editor', label: 'Video Editor', icon: Sliders },
    { id: 'templates', label: 'Templates', icon: Captions },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'subscription', label: 'Subscription', icon: CreditCard }
  ];
  const handleDelete = (id: string) => setClips((prev) => prev.filter((c) => c.id !== id));
  const handleUpdateClip = (updated: ShortClipCandidate) => {
    setSelectedClip(updated);
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col md:flex-row pb-20 md:pb-0">
      <aside className="hidden md:flex flex-col w-64 bg-[#0a0e24] border-r border-slate-800 p-4">
        <div className="flex items-center gap-2.5 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-white text-sm">AI SHORTS STUDIO</span>
        </div>
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setSection(item.id)} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${section === item.id ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Icon className="w-4 h-4" /> <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button onClick={onBackToLanding} className="mt-auto flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2">
          <ArrowLeft className="w-4 h-4" /> Back to Landing Page
        </button>
      </aside>
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white capitalize">{section}</h1>
            <p className="text-xs text-slate-400">Cloud Worker Queue: Active • Language: {language}</p>
          </div>
          <div className="flex gap-2">
            <a href="/api/downloads/zip/proj_test_1" className="px-3 py-2 rounded-xl bg-[#0f1429] border border-slate-700 text-xs font-semibold flex items-center gap-1.5 text-white">
              <Archive className="w-3.5 h-3.5 text-purple-400" /> Download All ZIP
            </a>
            <button onClick={onBackToLanding} className="md:hidden px-3 py-2 rounded-xl bg-slate-800 text-xs">Exit</button>
          </div>
        </div>

        {(section === 'dashboard' || section === 'projects') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clips.map((clip) => (
              <ShortCard
                key={clip.id}
                clip={clip}
                onPreview={(c) => { setSelectedClip(c); setSection('editor'); }}
                onEdit={(c) => { setSelectedClip(c); setSection('editor'); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {section === 'create' && (
          <div className="space-y-6">
            <div className="bg-[#0f1429] border border-slate-800 rounded-2xl p-4">
              <label className="text-xs font-semibold text-slate-300 block mb-2">Target Clip Duration</label>
              <div className="flex flex-wrap gap-2">
                {(['AUTO', 15, 30, 45, 60, 90] as ShortDurationOption[]).map((d) => (
                  <button key={d} onClick={() => setDuration(d)} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${duration === d ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                    {d === 'AUTO' ? 'Auto AI Duration' : `${d}s`}
                  </button>
                ))}
              </div>
            </div>
            <UploadStudioBox />
          </div>
        )}
        {section === 'editor' && (
          <VideoEditorPanel clip={selectedClip} language={language} onUpdateClip={handleUpdateClip} />
        )}

        {section === 'templates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CAPTION_TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setActiveTemplate(t.id)} className={`p-4 rounded-2xl border text-left ${activeTemplate === t.id ? 'bg-[#171f42] border-purple-500' : 'bg-[#0f1429] border-slate-800'}`}>
                <div className="text-xs text-slate-400 mb-2">{t.name}</div>
                <div className={t.styleClass}>{t.previewText}</div>
              </button>
            ))}
          </div>
        )}

        {(section === 'settings' || section === 'subscription') && (
          <div className="bg-[#0f1429] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white">Language & Cloud Quota Settings</h3>
            <div className="flex gap-2">
              {(['Hinglish', 'Hindi', 'English'] as const).map((lang) => (
                <button key={lang} onClick={() => setLanguage(lang)} className={`px-4 py-2 rounded-xl text-xs font-bold ${language === lang ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                  {lang}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">Current Plan: Free Starter (250 MB upload limit • Auto temp cleanup enabled).</p>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0e24]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex justify-around z-50">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setSection(item.id)} className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] ${section === item.id ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>
              <Icon className="w-4 h-4 mb-0.5" /> <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
