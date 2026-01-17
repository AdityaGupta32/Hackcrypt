import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { FileText, Database, TrendingUp, CheckCircle, Activity } from 'lucide-react';

const Hero = () => {
  const containerRef = useRef(null);
  const stackRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Text Entry Animation
      gsap.fromTo(".hero-text", 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 }
      );

      // 2. Card Stack Entry (Fan Out)
      gsap.fromTo(".stack-card", 
        { opacity: 0, y: 100, scale: 0.8 }, 
        { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.15, ease: "back.out(1.2)", delay: 0.5 }
      );

      // 3. Floating Animation (Continuous)
      gsap.to(".stack-wrapper", {
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // 4. Subtle Parallax on Mouse Move
      const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 20;
        const y = (clientY / window.innerHeight - 0.5) * 20;
        
        gsap.to(".stack-card-1", { x: x * 0.5, y: y * 0.5, rotation: -6, duration: 1 }); // Back
        gsap.to(".stack-card-2", { x: x * 0.8, y: y * 0.8, rotation: 3, duration: 1 });  // Middle
        gsap.to(".stack-card-3", { x: x * 1.2, y: y * 1.2, rotation: -3, duration: 1 }); // Front
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="min-h-screen flex items-center justify-center px-6 relative pt-20 overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-500"
    >
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* --- LEFT: TEXT CONTENT --- */}
        <div className="text-center lg:text-left">
          <div className="hero-text inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-emerald-500/30 bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-semibold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            AI-Powered Financial Intelligence
          </div>
          
          <h1 className="hero-text text-5xl md:text-7xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white leading-tight">
            Turn Chaos into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400">
              Clear Capital
            </span>
          </h1>
          
          <p className="hero-text text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Upload raw statements, extract line-item data, and visualize financial health with 99.9% accuracy using our next-gen ingestion engine.
          </p>
          
          <div className="hero-text flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a href="#upload" className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2">
              Start Ingestion <div className="w-2 h-2 bg-white rounded-full animate-pulse"/>
            </a>
            <a href="#process" className="px-8 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
              View Pipeline
            </a>
          </div>
        </div>

        {/* --- RIGHT: 3D STACKED CARD ANIMATION --- */}
        <div className="relative h-[500px] flex items-center justify-center perspective-1000 hidden lg:flex">
           <div className="stack-wrapper relative w-full max-w-md h-full flex items-center justify-center">
              
              {/* CARD 1: RAW DATA (Back) */}
              <div className="stack-card stack-card-1 absolute w-72 h-48 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm shadow-xl -rotate-6 translate-x-[-40px] translate-y-[-40px] p-4 flex flex-col justify-between z-0">
                  <div className="flex items-center gap-3 opacity-50">
                      <div className="w-8 h-8 rounded-lg bg-slate-300 dark:bg-slate-700 flex items-center justify-center"><FileText className="w-4 h-4 text-slate-500"/></div>
                      <div className="h-2 w-24 bg-slate-300 dark:bg-slate-700 rounded"/>
                  </div>
                  <div className="space-y-2 opacity-30">
                      <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded"/>
                      <div className="h-2 w-3/4 bg-slate-300 dark:bg-slate-700 rounded"/>
                      <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded"/>
                  </div>
              </div>

              {/* CARD 2: PROCESSING (Middle) */}
              <div className="stack-card stack-card-2 absolute w-72 h-48 rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-2xl rotate-3 translate-x-[20px] translate-y-[-20px] p-5 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-500"/>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Processing...</span>
                      </div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"/>
                  </div>
                  <div className="font-mono text-[10px] text-blue-800 dark:text-blue-300 opacity-60 overflow-hidden">
                      {`{ "id": "tx_99", "amt": 5000 }\n{ "status": "verified" }\n> Analyzing patterns...`}
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-blue-900/30 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-2/3 animate-pulse"/>
                  </div>
              </div>

              {/* CARD 3: INSIGHT (Front) */}
              <div className="stack-card stack-card-3 absolute w-80 h-52 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#0f172a] shadow-[0_20px_50px_rgba(16,185,129,0.2)] -rotate-3 p-6 z-20 flex flex-col justify-between ring-1 ring-emerald-500/20">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Net Cashflow</p>
                          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">₹4.2L</h3>
                      </div>
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="w-6 h-6"/>
                      </div>
                  </div>
                  
                  <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><CheckCircle className="w-3 h-3 text-emerald-500"/> Risk Check</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">Passed</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Activity className="w-3 h-3 text-blue-500"/> Health Score</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">92/100</span>
                      </div>
                  </div>
                  
                  {/* Decorative Gradient Line */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-b-2xl"/>
              </div>

           </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;