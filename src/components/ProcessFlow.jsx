import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import DataStreamBackground from './DataStreamBackground'; 

gsap.registerPlugin(ScrollTrigger);

// --- Custom Animated Icons (Same as before) ---
const ExtractIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 overflow-visible">
    <defs>
      <linearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(16, 185, 129, 0)" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
      </linearGradient>
    </defs>
    <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-4H6a2 2 0 0 0-2 2z" className="stroke-slate-900 dark:stroke-white fill-none stroke-2"/>
    <polyline points="14 4 14 8 20 8" className="stroke-slate-900 dark:stroke-white fill-none stroke-2" />
    <rect x="2" y="0" width="20" height="2" fill="url(#scanGradient)" className="animate-scan opacity-80" />
    <style>{`.animate-scan { animation: scanMove 2s linear infinite; } @keyframes scanMove { 0% { transform: translateY(4px); opacity:0; } 50% { opacity:1; } 100% { transform: translateY(20px); opacity:0; } }`}</style>
  </svg>
);

const CleanIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 overflow-visible">
    <g className="animate-spin-slow origin-center">
      <circle cx="12" cy="12" r="9" className="stroke-slate-300 dark:stroke-slate-700 fill-none stroke-[1] stroke-dashed" />
      <path d="M12 2v2 M12 20v2 M2 12h2 M20 12h2" className="stroke-emerald-500 stroke-2" />
    </g>
    <style>{`.animate-spin-slow { animation: spin 8s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .stroke-dashed { stroke-dasharray: 4, 4; }`}</style>
  </svg>
);

const IntelligenceIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 overflow-visible">
    <path d="M4 12 h16 M12 4 v16 M6 6 l12 12 M6 18 l12 -12" className="stroke-slate-200 dark:stroke-slate-700 stroke-1" />
    <circle cx="12" cy="12" r="3" className="fill-purple-500 animate-pulse-node" />
    <circle cx="4" cy="12" r="2" className="fill-blue-500 animate-pulse-node" />
    <circle cx="20" cy="12" r="2" className="fill-emerald-500 animate-pulse-node" />
    <style>{`.animate-pulse-node { animation: pulseNode 2s ease-in-out infinite; } @keyframes pulseNode { 0%, 100% { r: 2; opacity: 0.6; } 50% { r: 3.5; opacity: 1; } }`}</style>
  </svg>
);

const ProcessFlow = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const steps = gsap.utils.toArray('.process-card');
    steps.forEach((step, i) => {
      gsap.fromTo(step, { opacity: 0, y: 30 }, { scrollTrigger: { trigger: step, start: "top 80%" }, opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
    });
  }, []);

  return (
    <section id="process" className="py-24 px-4 bg-slate-50 dark:bg-[#0b0f19] relative transition-colors duration-500 overflow-hidden">
      <DataStreamBackground />

      <div ref={containerRef} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16 relative z-10 items-center">
        
        {/* 🟢 LEFT: THE PIPELINE (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-12 relative pl-0 lg:pl-8">
            <div className="absolute left-8 md:left-[45px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-transparent via-slate-300 dark:via-emerald-500/30 to-transparent hidden md:block" />

            <StepCard icon={ExtractIcon} title="1. Extraction" desc="Binary parsing of raw PDFs & CSVs to recover structured text layers." />
            <StepCard icon={CleanIcon} title="2. Sanitation" desc="Formatting dates, stripping whitespace, and normalizing headers." />
            <StepCard icon={IntelligenceIcon} title="3. Intelligence" desc="AI categorization, fraud detection, and predictive scoring." />
        </div>

        {/* 🟢 RIGHT: CONTEXT INFO (2 Cols) */}
        <div className="lg:col-span-2 text-left pt-12 lg:pt-0">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900 dark:text-white leading-tight">
                How The <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Logic Flows</span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Our architecture separates data ingestion from analysis. By cleaning data *before* it hits the AI models, we ensure 99.9% accuracy.
            </p>
            <div className="flex flex-col gap-4">
                <StatusBadge color="bg-emerald-500" text="Real-time Processing" />
                <StatusBadge color="bg-blue-500" text="Zero-Retention Policy" />
            </div>
        </div>

      </div>
    </section>
  );
};

const StepCard = ({ icon: Icon, title, desc }) => (
    <div className="process-card flex flex-row items-center gap-8 relative">
        <div className="relative z-10 shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-xl shadow-blue-500/10 dark:shadow-emerald-500/10 backdrop-blur-md">
                <Icon />
            </div>
        </div>
        <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm leading-relaxed max-w-sm">{desc}</p>
        </div>
    </div>
);

const StatusBadge = ({ color, text }) => (
    <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color} animate-pulse`}/>
        <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{text}</span>
    </div>
);

export default ProcessFlow;