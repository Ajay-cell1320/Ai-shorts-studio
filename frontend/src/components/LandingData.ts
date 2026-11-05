import { Sparkles, Smartphone, Captions, Wand2, Film, Zap } from 'lucide-react';

export const FEATURES = [
  {
    icon: Sparkles,
    title: 'Gemini AI Moment Detection',
    description: 'Analyses transcripts to detect hooks, emotional stories, and insights without inventing timestamps.'
  },
  {
    icon: Smartphone,
    title: '9:16 Vertical Auto-Crop',
    description: 'Converts horizontal videos into 1080x1920 vertical Shorts with intelligent framing and blurred background fill.'
  },
  {
    icon: Captions,
    title: 'Hindi, English & Hinglish Captions',
    description: 'Generates accurate word-level timestamps across English, Devanagari Hindi, and conversational Hinglish.'
  },
  {
    icon: Wand2,
    title: 'AI Hooks & Title Generator',
    description: 'Produces 5 title ideas, 5 scroll-stopping hooks, 3 descriptions, and hashtags for every Short.'
  },
  {
    icon: Film,
    title: '6 Viral Caption Templates',
    description: 'Switch between Viral Bold, Podcast Style, Documentary, Minimal White, Karaoke Highlight, and Gaming Style.'
  },
  {
    icon: Zap,
    title: 'Cloud FFmpeg Rendering',
    description: 'All heavy video cutting, cropping, and subtitle burning runs on cloud workers so your phone stays cool.'
  }
];

export const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Upload Video or Authorized Link',
    description: 'Select an MP4 or MOV file from your phone or paste an authorized cloud video stream URL.'
  },
  {
    step: '02',
    title: 'AI Transcribes & Ranks Clips',
    description: 'Cloud speech-to-text extracts timestamps while Google Gemini ranks the best 15s to 90s moments.'
  },
  {
    step: '03',
    title: 'Style Captions & Download MP4',
    description: 'Customize caption fonts, colors, and templates, preview vertical clips, and download ready MP4s.'
  }
];

export const PRICING_PLANS = [
  {
    name: 'Free Starter',
    price: '₹0',
    period: '/month',
    description: 'Ideal for testing workflows and creating your first AI Shorts.',
    features: [
      'Up to 250 MB per video upload',
      '3 AI video analyses per month',
      '720p / 1080p vertical 9:16 export',
      'Hindi, English & Hinglish captions',
      'Auto-cleanup after 24 hours'
    ],
    buttonText: 'Start Free',
    highlighted: false
  },
  {
    name: 'Creator Pro',
    price: '₹799',
    period: '/month',
    description: 'For daily YouTube Shorts, Reels, and podcast creators.',
    features: [
      'Up to 1 GB per video upload',
      '30 hours of cloud AI transcription/mo',
      'Full 1080x1920 HD cloud FFmpeg rendering',
      'All 6 viral caption templates unlocked',
      'Bulk ZIP export & 14-day storage'
    ],
    buttonText: 'Upgrade to Pro',
    highlighted: true
  },
  {
    name: 'Studio Agency',
    price: '₹2,499',
    period: '/month',
    description: 'High-volume cloud processing for editors and media teams.',
    features: [
      'Up to 3 GB per video upload',
      '100 hours of priority cloud rendering',
      'Custom brand caption colors & positioning',
      'Dedicated background worker queue',
      '30-day cloud archive & priority support'
    ],
    buttonText: 'Contact Sales',
    highlighted: false
  }
];

export const FAQS = [
  {
    question: 'Does heavy video rendering happen on my Android phone?',
    answer: 'No. Your phone only uploads videos, previews clips, edits captions, and downloads finished MP4s. FFmpeg 9:16 rendering runs on cloud workers.'
  },
  {
    question: 'Why can’t I paste any random copyrighted YouTube link?',
    answer: 'AI Shorts Studio respects YouTube Terms of Service, copyright laws, and DRM controls. Upload your own MP4/MOV files or provide authorized direct cloud links.'
  },
  {
    question: 'Does it support Hindi and Hinglish videos?',
    answer: 'Yes. Our transcription pipeline supports English, Hindi, and conversational Hinglish with word-level timestamps and editable subtitles.'
  },
  {
    question: 'Does a high AI Engagement Score guarantee my Short will go viral?',
    answer: 'No tool guarantees virality. The Engagement Score evaluates hook strength and pacing to help you pick your strongest clips faster.'
  }
];
