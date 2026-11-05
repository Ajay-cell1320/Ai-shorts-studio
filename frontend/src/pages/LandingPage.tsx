import React, { useState, useRef } from 'react';
import { Sparkles, Scissors, Play, Check, ChevronDown, ArrowRight, ShieldCheck } from 'lucide-react';
import UploadStudioBox from '../components/UploadStudioBox';
import { FEATURES, WORKFLOW_STEPS, PRICING_PLANS, FAQS } from '../components/LandingData';

export default function LandingPage({ onOpenDashboard }: { onOpenDashboard?: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const uploadRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => ref.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#060814]/85 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base sm:text-lg text-white">AI SHORTS STUDIO</span>
          </div>
          <button
            onClick={onOpenDashboard || (() => scrollTo(uploadRef))}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            Start Creating
          </button>
        </div>
      </header>

      <section className="pt-10 pb-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" /> <span>AI-Powered Vertical Video Studio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Turn Long Videos Into{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Engaging Shorts With AI
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Upload your video. AI finds the best moments, creates vertical Shorts and adds captions automatically.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => scrollTo(uploadRef)}
              className="px-7 py-4 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center gap-2"
            >
              <span>Start Creating</span> <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTo(featuresRef)}
              className="px-7 py-4 rounded-2xl font-semibold bg-[#0f1429] text-slate-200 border border-slate-700 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-purple-400" /> <span>Explore Features</span>
            </button>
          </div>
        </div>
        <div ref={uploadRef}>
          <UploadStudioBox />
        </div>
      </section>

      <section ref={featuresRef} className="py-14 px-4 bg-[#080b1a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-10">Core AI Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-[#0f1429] border border-slate-800 rounded-2xl p-6">
                  <Icon className="w-7 h-7 text-purple-400 mb-3" />
                  <h3 className="text-lg font-bold text-white">{f.title}</h3>
                  <p className="text-sm text-slate-400 mt-2">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {WORKFLOW_STEPS.map((s, i) => (
              <div key={i} className="bg-[#0f1429] border border-slate-800 rounded-2xl p-6">
                <div className="text-2xl font-black text-purple-400 mb-2">{s.step}</div>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="text-sm text-slate-400 mt-2">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-[#080b1a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-10">Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((p, i) => (
              <div key={i} className={`rounded-3xl p-6 border ${p.highlighted ? 'bg-[#151c38] border-purple-500' : 'bg-[#0f1429] border-slate-800'}`}>
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <div className="mt-3 text-3xl font-extrabold text-white">{p.price}<span className="text-sm font-normal text-slate-400">{p.period}</span></div>
                <p className="text-xs text-slate-400 mt-2">{p.description}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-200">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span>{feat}</span></li>
                  ))}
                </ul>
                <button onClick={() => scrollTo(uploadRef)} className="mt-6 w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  {p.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center text-white mb-8">FAQ</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-[#0f1429] border border-slate-800 rounded-2xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-5 py-4 text-left flex justify-between items-center font-semibold text-sm text-white">
                <span>{faq.question}</span>
                <ChevronDown className={`w-4 h-4 transition ${openFaq === i ? 'rotate-180 text-purple-400' : ''}`} />
              </button>
              {openFaq === i && <div className="px-5 pb-4 text-xs sm:text-sm text-slate-300 border-t border-slate-800/70 pt-3">{faq.answer}</div>}
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-800 bg-[#04060e] py-8 px-4 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2 text-white font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> AI SHORTS STUDIO • YouTube ToS Compliant
        </div>
        <p>© {new Date().getFullYear()} AI Shorts Studio. Built for Mobile & Desktop.</p>
      </footer>
    </div>
  );
}
