import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { 
  ArrowUpRight, 
  Layers, 
  MessageSquare, 
  Calendar, 
  Trello, 
  CheckCircle,
  Activity,
  Play
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onLaunchWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchWorkspace }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const accordionRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Hero Entrance Animation
    const heroTl = gsap.timeline();
    heroTl.fromTo('.hero-fade-up', 
      { y: 60, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.15 }
    );
    heroTl.fromTo('.hero-floating-element', 
      { scale: 0.9, opacity: 0, rotate: -2 }, 
      { scale: 1, opacity: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1, 0.75)' },
      '-=0.8'
    );

    // 2. Scroll Pinning / Split (Desire section)
    ScrollTrigger.create({
      trigger: '.split-pin-section',
      start: 'top top',
      end: '+=100%',
      pin: '.pinned-left-side',
      pinSpacing: true,
      scrub: 1,
    });

    // 3. Card Stacking Scroll Animation (Desire section)
    const cards = gsap.utils.toArray('.stack-card');
    cards.forEach((card: any, i: number) => {
      if (i === 0) return;
      gsap.fromTo(card, 
        { yPercent: 100, opacity: 0.7 },
        { 
          yPercent: 0, 
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top bottom-=100',
            end: 'top top+=200',
            scrub: true,
          }
        }
      );
    });

    // 4. Bento cards reveal
    gsap.fromTo('.bento-item', 
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: bentoRef.current,
          start: 'top 80%',
        }
      }
    );

  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="overflow-x-hidden w-full max-w-full bg-[#05070B] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white">
      
      {/* ── NAVIGATION BAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-5 bg-[#05070B]/40 backdrop-blur-xl border-b border-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-550/20">
            <span className="font-extrabold text-white text-sm tracking-tighter">A</span>
          </div>
          <span className="font-bold text-sm tracking-wider uppercase text-white font-display">Aether</span>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onLaunchWorkspace}
            className="group relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-550 text-white transition-all duration-300 shadow-md shadow-indigo-650/20 cursor-pointer overflow-hidden"
          >
            <span>Launch Workspace</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-350" />
          </button>
        </div>
      </nav>

      {/* ── ATTENTION: HERO SECTION ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-16 px-6 md:px-12 overflow-hidden bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-950/15 via-transparent to-transparent">
        {/* Shifting radial mesh background */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000"></div>
        <div className="absolute bottom-12 left-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left: Artistic Asymmetry Layout */}
          <div className="lg:col-span-7 space-y-8 z-10 text-left">
            <div className="hero-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/45 border border-indigo-900/40 text-[10px] font-bold text-indigo-400 tracking-widest uppercase">
              <Activity className="w-3 h-3 text-indigo-400" />
              <span>Next-Gen Product Coordination</span>
            </div>

            {/* Title with Inline Typography Image */}
            <h1 className="hero-fade-up text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05] font-display max-w-2xl">
              Aligning teams
              <span className="inline-block w-16 md:w-24 h-9 md:h-12 rounded-full align-middle bg-cover bg-center mx-2.5 border border-indigo-500/25 grayscale contrast-125 brightness-90 shadow-inner" style={{ backgroundImage: "url('https://picsum.photos/seed/coordination/300/200')" }}></span>
              in absolute harmony.
            </h1>

            <p className="hero-fade-up text-xs md:text-sm text-slate-400 max-w-lg leading-relaxed">
              Ditch fragmented trackers. Core roadmap milestones, automated daily standups, and developer workload balancing unified in one premium workspace.
            </p>

            {/* Action buttons with strict contrast */}
            <div className="hero-fade-up flex items-center gap-4 pt-4">
              <button 
                onClick={onLaunchWorkspace}
                className="px-6 py-3 rounded-xl text-xs font-semibold bg-white text-[#05070B] hover:bg-slate-200 transition duration-300 shadow-xl shadow-white/5 cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Workspace</span>
              </button>
              <a 
                href="#features" 
                className="px-6 py-3 rounded-xl text-xs font-semibold border border-slate-800 text-slate-350 hover:text-white hover:border-slate-700 hover:bg-slate-900/20 transition duration-300"
              >
                Learn Features
              </a>
            </div>
          </div>

          {/* Hero Right: Floating Layered Mockup */}
          <div className="lg:col-span-5 relative flex justify-center z-10">
            <div className="hero-floating-element relative w-full max-w-sm aspect-[4/5] rounded-3xl bg-[#090C15] border border-slate-850 p-6 shadow-2xl flex flex-col justify-between overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-900/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AETHER DASHBOARD v1.0</span>
              </div>

              {/* Graphic element representing task status */}
              <div className="space-y-4 my-6 flex-1 flex flex-col justify-center">
                <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-900/40 border border-indigo-850 flex items-center justify-center text-indigo-400">
                      <Trello className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">Interactive Kanban</span>
                      <span className="text-[9px] text-slate-500">Real-time dragging updates</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-indigo-650 text-white">Active</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0A0E1A] border border-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-900/40 border border-purple-850 flex items-center justify-center text-purple-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">Daily Standups</span>
                      <span className="text-[9px] text-slate-500">Asynchronous update logs</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-slate-900 text-slate-400">Synced</span>
                </div>
              </div>

              {/* Bottom footer bar */}
              <div className="pt-4 border-t border-slate-900/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" className="w-5 h-5 rounded-full bg-slate-800" />
                  <span className="text-[10px] text-slate-400 font-semibold">Alex Rivera (PM)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[9px] font-extrabold text-emerald-400 uppercase">Live Connection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DUSTY RUNNING PARTNERS (INFINITE MARQUEE) ── */}
      <section ref={marqueeRef} className="py-12 border-y border-slate-900/65 bg-[#05070B] overflow-hidden select-none">
        <div className="flex whitespace-nowrap gap-16 animate-marquee inline-block">
          <div className="flex items-center gap-16 text-xs font-bold tracking-widest text-slate-650 uppercase">
            <span>Unified Workflow</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Real-time Syncing</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Milestone Roadmaps</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Asynchronous Standups</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Developer Workload Balancing</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          </div>
          {/* Double repeat for seamless infinite loop */}
          <div className="flex items-center gap-16 text-xs font-bold tracking-widest text-slate-650 uppercase">
            <span>Unified Workflow</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Real-time Syncing</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Milestone Roadmaps</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Asynchronous Standups</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Developer Workload Balancing</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          </div>
        </div>
      </section>

      {/* ── INTEREST: MATHEMATICALLY FLAWLESS BENTO GRID ── */}
      <section id="features" ref={bentoRef} className="py-32 md:py-48 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white font-display tracking-tight">
            Engineered for elite product delivery.
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
            A cohesive suite of collaborative components working in perfect synergy.
          </p>
        </div>

        {/* Bento Grid: dense layout with strict coordinates */}
        <div className="grid grid-cols-1 md:grid-cols-3 grid-flow-row-dense gap-5">
          
          {/* Bento Card 1: Kanban Progress Dashboard (col-span 2, row-span 2) */}
          <div className="bento-item md:col-span-2 md:row-span-2 glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden group flex flex-col justify-between aspect-[1.3] md:aspect-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-555/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-555/10 transition duration-700 ease-out"></div>
            
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-900/40 flex items-center justify-center text-indigo-400">
                <Trello className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white font-display pt-2">Multi-State Task Databases</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Switch instantly between visual Kanban boards and spreadsheets with instant, optimistic client state updates.
              </p>
            </div>

            <div className="mt-8 border border-slate-900/80 rounded-2xl bg-[#090C15] overflow-hidden p-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2.5">
                  <div className="h-1.5 w-1/3 rounded bg-indigo-650"></div>
                  <div className="p-3 rounded-xl bg-indigo-950/25 border border-indigo-900/30 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-white">Optimize DB Queries</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-400 font-extrabold uppercase">Todo</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5">
                  <div className="h-1.5 w-1/3 rounded bg-emerald-650"></div>
                  <div className="p-3 rounded-xl bg-emerald-950/15 border border-emerald-900/30 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-300 line-through">Implement WebSockets</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 font-extrabold uppercase">Done</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Interactive Real-time Chat (col-span 1, row-span 2) */}
          <div className="bento-item md:col-span-1 md:row-span-2 glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden group flex flex-col justify-between min-h-[350px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-555/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-purple-555/10 transition duration-700 ease-out"></div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-950/50 border border-purple-900/40 flex items-center justify-center text-purple-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white font-display pt-2">Integrated Audio & Text Chat</h3>
              <p className="text-xs text-slate-400">
                Discuss blockers instantly within team rooms with high-fidelity WebRTC call signaling.
              </p>
            </div>

            <div className="mt-8 space-y-3.5">
              <div className="flex gap-2.5 items-start">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Aether" alt="User" className="w-5.5 h-5.5 rounded-full bg-slate-900" />
                <div className="p-3 rounded-2xl rounded-tl-none bg-[#090C15] border border-slate-900 text-[10px] text-slate-300 max-w-[80%]">
                  Hey team, did we push the standups live?
                </div>
              </div>
              <div className="flex gap-2.5 items-start justify-end">
                <div className="p-3 rounded-2xl rounded-tr-none bg-indigo-600 text-white text-[10px] max-w-[80%]">
                  Yes, they're fully synced!
                </div>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=PM" alt="User" className="w-5.5 h-5.5 rounded-full bg-slate-900" />
              </div>
            </div>
          </div>

          {/* Bento Card 3: Milestone Timelines (col-span 3, row-span 1) */}
          <div className="bento-item md:col-span-3 md:row-span-1 glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-555/5 rounded-full blur-[90px] pointer-events-none group-hover:bg-emerald-555/10 transition duration-700 ease-out"></div>

            <div className="space-y-2 max-w-lg">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-900/40 flex items-center justify-center text-emerald-450">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white font-display pt-2">Milestone Roadmaps</h3>
              <p className="text-xs text-slate-400">
                Define key delivery targets and watch progress aggregate automatically as tasks move to completion.
              </p>
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto pb-2 md:pb-0">
              <div className="flex-1 min-w-[150px] p-4 rounded-2xl bg-[#090C15] border border-slate-900 space-y-2.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-350">v1.0 Launch</span>
                  <span className="text-indigo-400">82%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>

              <div className="flex-1 min-w-[150px] p-4 rounded-2xl bg-[#090C15] border border-slate-900 space-y-2.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-350">Analytics API</span>
                  <span className="text-emerald-450">100%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── DESIRE: HORIZONTAL ACCORDIONS WITH SCROLL PINNING ── */}
      <section ref={accordionRef} className="split-pin-section min-h-screen bg-[#030508] border-y border-slate-900/60 relative flex flex-col lg:flex-row items-stretch">
        
        {/* Pinned Left Panel */}
        <div className="pinned-left-side lg:w-1/2 p-12 md:p-24 flex flex-col justify-center space-y-6 bg-[#030508]/80 backdrop-blur-md z-20">
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Core Framework</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white font-display tracking-tight leading-tight">
            Designed for speed, built for clarity.
          </h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-md">
            Hover over the structural panels to explore how Aether keeps your product team perfectly synchronized.
          </p>
        </div>

        {/* Right Side: Horizontal Panels */}
        <div className="lg:w-1/2 flex flex-col lg:flex-row items-stretch border-l border-slate-900/60 overflow-hidden">
          
          {/* Panel 1 */}
          <div className="group flex-1 min-h-[300px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-slate-900/60 relative p-8 flex flex-col justify-between transition-all duration-700 hover:flex-[2.5] bg-[#05070B] overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center grayscale contrast-125 opacity-10 group-hover:opacity-30 transition duration-700" style={{ backgroundImage: "url('https://picsum.photos/seed/task/800/1000')" }}></div>
            
            <span className="text-xs font-bold text-slate-650 font-display">01</span>
            <div className="space-y-3 z-10">
              <h3 className="text-xl font-bold text-white font-display">Task Orchestrator</h3>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 transition duration-300 max-w-sm">
                Optimistic states make updates feel instant. Changes sync seamlessly with Node.js and MongoDB under the hood.
              </p>
            </div>
          </div>

          {/* Panel 2 */}
          <div className="group flex-1 min-h-[300px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-slate-900/60 relative p-8 flex flex-col justify-between transition-all duration-700 hover:flex-[2.5] bg-[#05070B] overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center grayscale contrast-125 opacity-10 group-hover:opacity-30 transition duration-700" style={{ backgroundImage: "url('https://picsum.photos/seed/standup/800/1000')" }}></div>
            
            <span className="text-xs font-bold text-slate-650 font-display">02</span>
            <div className="space-y-3 z-10">
              <h3 className="text-xl font-bold text-white font-display">Asynchronous Syncs</h3>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 transition duration-300 max-w-sm">
                Keep the team focused. Share updates, identify blockers, and record daily status logs asynchronously.
              </p>
            </div>
          </div>

          {/* Panel 3 */}
          <div className="group flex-1 min-h-[300px] lg:min-h-0 relative p-8 flex flex-col justify-between transition-all duration-700 hover:flex-[2.5] bg-[#05070B] overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center grayscale contrast-125 opacity-10 group-hover:opacity-30 transition duration-700" style={{ backgroundImage: "url('https://picsum.photos/seed/analytics/800/1000')" }}></div>
            
            <span className="text-xs font-bold text-slate-650 font-display">03</span>
            <div className="space-y-3 z-10">
              <h3 className="text-xl font-bold text-white font-display">Workload Balancing</h3>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 transition duration-300 max-w-sm">
                Prevent burnout. The interactive charts map tasks and points directly to members to maintain absolute equity.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── CARD STACKING DEMO (DESIRE SECTION) ── */}
      <section ref={stackRef} className="py-32 md:py-48 px-6 md:px-12 max-w-4xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Built to Scale</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white font-display tracking-tight leading-tight">
            Everything your team needs to deliver.
          </h2>
        </div>

        {/* Stacking container */}
        <div className="relative space-y-12">
          {/* Card 1 */}
          <div className="stack-card sticky top-24 p-8 md:p-12 rounded-3xl bg-[#090C15] border border-slate-850 shadow-2xl flex flex-col justify-between gap-6 min-h-[350px]">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Features Suite</span>
                <h3 className="text-2xl font-bold text-white font-display">Optimistic Rendering</h3>
              </div>
              <CheckCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-xs md:text-sm text-slate-450 leading-relaxed max-w-xl">
              Tasks and status modifications are rendered in real-time instantly on the client, with silent background persistence syncing to the backend to minimize drag.
            </p>
            <div className="flex justify-between items-center pt-4 border-t border-slate-900">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Optimized Client Logic</span>
              <span className="text-[10px] text-slate-400 font-semibold">Instant Updates</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="stack-card sticky top-28 p-8 md:p-12 rounded-3xl bg-[#0B0F1B] border border-slate-850 shadow-2xl flex flex-col justify-between gap-6 min-h-[350px]">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Features Suite</span>
                <h3 className="text-2xl font-bold text-white font-display">Asynchronous Sync</h3>
              </div>
              <CheckCircle className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-xs md:text-sm text-slate-450 leading-relaxed max-w-xl">
              Align teams in multiple time zones. Members fill status logs asynchronously on their daily schedule, aggregating workload details automatically.
            </p>
            <div className="flex justify-between items-center pt-4 border-t border-slate-900">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Timezone Friendly</span>
              <span className="text-[10px] text-slate-400 font-semibold">Async Logs</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="stack-card sticky top-32 p-8 md:p-12 rounded-3xl bg-[#0C1222] border border-slate-850 shadow-2xl flex flex-col justify-between gap-6 min-h-[350px]">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-emerald-450 uppercase tracking-wider">Features Suite</span>
                <h3 className="text-2xl font-bold text-white font-display">Live Audio Spaces</h3>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-450" />
            </div>
            <p className="text-xs md:text-sm text-slate-450 leading-relaxed max-w-xl">
              Initiate low-latency audio calls with WebRTC signaling right inside team channels. Brainstorm blockers and align sprints without switching tabs.
            </p>
            <div className="flex justify-between items-center pt-4 border-t border-slate-900">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Peer-to-Peer</span>
              <span className="text-[10px] text-slate-400 font-semibold">WebRTC Calls</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTION: FOOTER CTA SECTION ── */}
      <section className="relative py-32 md:py-48 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#05070B] to-[#05070B] border-t border-slate-900/60 overflow-hidden text-center px-6">
        <div className="absolute inset-0 bg-[#05070B]/5 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl md:text-7xl font-extrabold text-white font-display tracking-tight leading-none">
            Ready to unify<br />your product workspace?
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Initialize your product board in less than 30 seconds. No card required. Completely free for dev environments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button 
              onClick={onLaunchWorkspace}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-xs font-semibold bg-white text-[#05070B] hover:bg-slate-200 transition duration-300 shadow-xl shadow-white/5 cursor-pointer"
            >
              Get Started for Free
            </button>
          </div>
        </div>

        {/* Minimal Footer Links */}
        <div className="max-w-7xl mx-auto mt-32 pt-8 border-t border-slate-950 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-widest uppercase">AETHER</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-slate-350 transition">Features</a>
            <a href="#features" className="hover:text-slate-350 transition">Security</a>
            <a href="#features" className="hover:text-slate-350 transition">Privacy Policy</a>
          </div>
        </div>
      </section>

    </main>
  );
};
