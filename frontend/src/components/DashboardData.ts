import { ShortClipCandidate, CaptionTemplateId } from '../../../shared/types';

export type DashboardSection =
  | 'dashboard'
  | 'create'
  | 'projects'
  | 'editor'
  | 'templates'
  | 'settings'
  | 'subscription';

export const CAPTION_TEMPLATES: {
  id: CaptionTemplateId;
  name: string;
  previewText: string;
  styleClass: string;
}[] = [
  { id: 'viral-bold', name: 'Viral Bold', previewText: 'WAIT FOR THE END!', styleClass: 'font-black text-yellow-300 uppercase' },
  { id: 'podcast-style', name: 'Podcast Style', previewText: 'Here is the real secret...', styleClass: 'font-bold text-white bg-black/75 px-2 py-0.5 rounded' },
  { id: 'documentary', name: 'Documentary', previewText: 'In 2026, everything changed.', styleClass: 'font-serif italic text-amber-200' },
  { id: 'minimal-white', name: 'Minimal White', previewText: 'Simple clean aesthetics', styleClass: 'font-medium text-slate-100' },
  { id: 'karaoke-highlight', name: 'Karaoke Highlight', previewText: 'Focus on THIS word', styleClass: 'font-extrabold text-white bg-purple-600/80 px-2 rounded' },
  { id: 'gaming-style', name: 'Gaming Style', previewText: 'CLUTCH MOMENT +999', styleClass: 'font-black text-cyan-400 uppercase' }
];

export const SAMPLE_CLIPS: ShortClipCandidate[] = [
  {
    id: 'clip-101',
    projectId: 'proj-1',
    startTime: 42,
    endTime: 72,
    duration: 30,
    title: '3 Mistakes Beginners Make With AI Tools',
    hook: 'Stop wasting hours prompting the wrong way—do this instead.',
    description: 'Actionable breakdown of AI workflow mistakes in Hindi & English.',
    category: 'Educational',
    engagementScore: 91,
    transcriptExcerpt: 'Sabse badi galti log tab karte hain jab woh context nahi dete...',
    hashtags: ['#AIShorts', '#Productivity', '#TechHindi'],
    keywords: ['AI workflow', 'prompt engineering'],
    status: 'COMPLETED'
  },
  {
    id: 'clip-102',
    projectId: 'proj-1',
    startTime: 120,
    endTime: 165,
    duration: 45,
    title: 'How Cloud Rendering Saves Your Phone Battery',
    hook: 'Never run heavy video encoding directly on a mobile CPU.',
    description: 'Why offloading FFmpeg to cloud workers makes mobile coding fast.',
    category: 'High-Impact',
    engagementScore: 86,
    transcriptExcerpt: 'Phone sirf control center hai, asli rendering cloud worker par hoti hai...',
    hashtags: ['#CloudComputing', '#MobileDev', '#ShortsStudio'],
    keywords: ['FFmpeg cloud', 'mobile coding'],
    status: 'COMPLETED'
  }
];
