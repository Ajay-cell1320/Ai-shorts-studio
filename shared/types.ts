export type ProcessingStatus =
  | 'IDLE'
  | 'UPLOADING'
  | 'TRANSCRIBING'
  | 'ANALYZING'
  | 'RENDERING'
  | 'COMPLETED'
  | 'FAILED';

export type ShortDurationOption = 15 | 30 | 45 | 60 | 90 | 'AUTO';

export type CaptionTemplateId =
  | 'viral-bold'
  | 'podcast-style'
  | 'documentary'
  | 'minimal-white'
  | 'karaoke-highlight'
  | 'gaming-style';

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface ShortClipCandidate {
  id: string;
  projectId: string;
  startTime: number;
  endTime: number;
  duration: number;
  title: string;
  hook: string;
  description: string;
  category: 'Educational' | 'Emotional' | 'Storytelling' | 'High-Impact' | 'Insight';
  engagementScore: number;
  transcriptExcerpt: string;
  hashtags: string[];
  keywords: string[];
  status: ProcessingStatus;
  outputUrl?: string;
  thumbnailUrl?: string;
}
