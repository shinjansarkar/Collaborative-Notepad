'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, ArrowRight, BookOpen, Users, Shield, Save, 
  Code, Share2, Play, FileText, Activity, PenTool
} from 'lucide-react';
import { motion } from 'framer-motion';
import BackgroundBlobs from '@/components/BackgroundBlobs';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const createNewRoom = async () => {
    setLoading(true);
    setError('');
    try {
      let userId = localStorage.getItem('notepad_user_id');
      if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('notepad_user_id', userId);
      }
      
      const response = await fetch(`${API_BASE}/api/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) {
        throw new Error('Could not contact the server.');
      }
      const data = await response.json();
      router.push(`/room/${data.room_id}`);
    } catch (err) {
      console.error(err);
      setError('Connection failed. Make sure your Python Flask backend is running on port 8000!');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveDemo = () => {
    router.push('/room/demo-space');
  };

  // Fountain pen animation coordinates (in percent / pixels) for the drawing board
  const penMotion = {
    x: [40, 260, 40, 200, 40, 180, 40],
    y: [42, 42, 74, 74, 106, 106, 42],
    rotate: [-45, -35, -45, -35, -45, -35, -45],
    transition: {
      duration: 7,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  // Text segments that reveal in tandem with the pen coordinates
  const [line1, setLine1] = useState(false);
  const [line2, setLine2] = useState(false);
  const [line3, setLine3] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setLine1(true);
      setLine2(false);
      setLine3(false);
      
      const t1 = setTimeout(() => setLine2(true), 2300);
      const t2 = setTimeout(() => setLine3(true), 4700);

      const t3 = setTimeout(() => {
        setLine1(false);
        setLine2(false);
        setLine3(false);
      }, 6800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    };

    cycle();
    const interval = setInterval(cycle, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen relative flex flex-col justify-between selection:bg-ink/10 selection:text-ink overflow-hidden theme-sepia transition-colors duration-450`}>
      {/* Dynamic light highlight shadows */}
      <BackgroundBlobs />

      {/* Redesigned Full-Width Sleek Header Navbar */}
      <header className="absolute top-0 left-0 w-full z-50 bg-bg-base/30 backdrop-blur-sm border-b border-border-main/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-ink">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-sans font-bold text-lg tracking-tight text-text-main">
              SyncPad
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-text-sub">
            <a href="#features" className="hover:text-ink transition-colors relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-ink transition-all group-hover:w-full"></span>
            </a>
            <a href="#workflow" className="hover:text-ink transition-colors relative group">
              Workflow
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-ink transition-all group-hover:w-full"></span>
            </a>
            <a href="https://github.com/shinjansarkar" target="_blank" className="hover:text-ink transition-colors relative group">
              Developer
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-ink transition-all group-hover:w-full"></span>
            </a>
          </nav>

          <button 
            onClick={createNewRoom}
            disabled={loading}
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-paper bg-text-main hover:bg-ink hover:text-white rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-85 cursor-pointer"
          >
            {loading ? 'Opening...' : 'Start Writing'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col pt-32 pb-20 z-10">
        <section className="px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center min-h-[75vh]">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 flex flex-col gap-8 text-center lg:text-left items-center lg:items-start">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-ink/20 text-ink text-[11px] font-bold uppercase tracking-widest bg-ink/5 backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5 fill-ink/20" />
              Dynamic Lined Canvas
            </motion.div>

            <div className="relative">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl sm:text-7xl lg:text-[5rem] font-serif font-bold tracking-tight text-text-main leading-[1] max-w-xl"
              >
                Write Together. <br />
                <span className="text-ink relative inline-block mt-2">
                  Ink in Real-Time.
                  {/* Underline SVG */}
                  <svg className="absolute -bottom-4 left-0 w-full h-6 pointer-events-none" viewBox="0 0 300 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <motion.path
                      d="M 5 15 C 60 10, 120 7, 180 8 C 220 9, 260 12, 295 7 C 240 12, 175 14, 115 13 C 75 12, 30 9, 12 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                      className="text-ink opacity-90"
                    />
                  </svg>
                </span>
              </motion.h1>
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-text-sub max-w-lg leading-relaxed font-sans mt-2"
            >
              A premium, high-aesthetic shared notepad. Co-edit documents on an elegant ruled paper canvas with overlay cursors and animated drawing lines.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-5 w-full justify-center lg:justify-start mt-4"
            >
              <button 
                onClick={createNewRoom}
                disabled={loading}
                className="px-8 py-4 rounded-xl text-white bg-ink hover:bg-ink-hover text-sm font-bold flex items-center gap-3 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all glow-ink"
              >
                {loading ? 'Formatting Journal...' : 'Start New Notepad'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleLiveDemo}
                className="px-8 py-4 rounded-xl bg-paper border border-border-main text-text-main text-sm font-bold flex items-center gap-3 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <Play className="w-4 h-4 fill-current opacity-80 text-ink" />
                Live Demo
              </button>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-600 text-xs mt-2 border-l-4 border-rose-600 pl-4 py-2 font-medium bg-rose-50"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Hero Right Page-Fold Notepad with Pen Drawing Animation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
            className="lg:col-span-6 w-full flex items-center justify-center relative"
          >
            {/* Background decorative offset card */}
            <div className="absolute inset-0 bg-paper/40 border border-border-main/50 rounded-2xl rotate-3 scale-95 z-0" />
            
            <div className="relative w-full max-w-[500px] aspect-[4/3] paper-sheet p-6 shadow-2xl flex flex-col gap-4 z-10 page-fold overflow-hidden glow-ink border-2 border-border-main/70">
              
              {/* Floating Fountain Pen drawing vector coordinates */}
              <motion.div
                animate={penMotion}
                className="absolute text-ink pointer-events-none z-20"
                style={{ originX: 0.2, originY: 0.8 }}
              >
                <PenTool className="w-8 h-8 -rotate-45 filter drop-shadow-xl" />
              </motion.div>

              {/* Card Title Decorator */}
              <div className="flex items-center justify-between border-b-2 border-border-main pb-3 pl-8 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-main">live_collaboration.md</span>
                </div>
                <div className="flex -space-x-2">
                  <span className="w-6 h-6 rounded-full bg-ink/10 border-2 border-paper text-[10px] flex items-center justify-center font-bold text-ink shadow-sm">A</span>
                  <span className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-paper text-[10px] flex items-center justify-center font-bold text-emerald-700 shadow-sm">S</span>
                </div>
              </div>

              {/* Text Area simulating Lined Paper writing */}
              <div className="flex-1 font-serif text-sm text-text-main leading-[32px] relative overflow-hidden pl-8">
                
                {/* SVG signature loop */}
                <svg className="absolute top-10 left-8 w-[180px] h-6 pointer-events-none" viewBox="0 0 150 20" fill="none">
                  <motion.path 
                    d="M 5 15 C 30 11, 70 8, 110 11 T 145 7"
                    stroke="var(--color-ink)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5.5 }}
                  />
                </svg>

                <p className="font-bold text-base mb-1"># Live Notepad Co-Editing</p>
                
                {/* Text reveals line by line */}
                <div className="space-y-0.5 italic">
                  <p className={`transition-opacity duration-500 ${line1 ? 'opacity-100' : 'opacity-0'}`}>
                    1. Share notepad URL with collaborators.
                  </p>
                  <p className={`transition-opacity duration-500 ${line2 ? 'opacity-100' : 'opacity-0'}`}>
                    2. Co-edit content instantly.
                  </p>
                  <p className={`transition-opacity duration-500 ${line3 ? 'opacity-100' : 'opacity-0'}`}>
                    3. Text updates cached automatically.
                  </p>
                </div>
              </div>

              {/* Page Footer Decorator */}
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-sub pl-8 pt-2 border-t-2 border-border-main shrink-0">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> saved in memory</span>
                <span>utf-8</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Creative Editorial Features Section */}
        <section id="features" className="px-6 py-32 max-w-7xl mx-auto w-full flex flex-col gap-24 relative mt-16">
          <div className="absolute inset-0 bg-paper border border-border-main/50 rounded-[3rem] shadow-2xl -z-10 -rotate-1 scale-95" />
          <div className="absolute inset-0 bg-paper border border-border-main rounded-[3rem] shadow-sm -z-10" />
          
          <div className="text-center flex flex-col items-center gap-6 pt-16">
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-text-main max-w-2xl leading-tight">
              A blank canvas built for pure <span className="text-ink italic">creativity</span> and collaboration.
            </h2>
            <p className="text-base lg:text-lg text-text-sub max-w-xl">
              Focus on typing. No setups, no complex tools. Just an elegant shared workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-8 pb-16">
            
            {/* Feature 1 */}
            <div className="bg-bg-base/50 rounded-3xl p-8 flex flex-col gap-5 border border-border-main/40 hover:-translate-y-2 transition-all duration-300 hover:shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ink/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-ink text-white rounded-2xl flex items-center justify-center shadow-lg shadow-ink/20 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main mb-2">Real-time Sync</h3>
                <p className="text-sm text-text-main/85 leading-relaxed font-sans font-medium">
                  Co-edit documents simultaneously with teammates. Edits propagate character-by-character instantly.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-bg-base/50 rounded-3xl p-8 flex flex-col gap-5 border border-border-main/40 hover:-translate-y-2 transition-all duration-300 hover:shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main mb-2">Presence Tracker</h3>
                <p className="text-sm text-text-main/85 leading-relaxed font-sans font-medium">
                  Keep track of who is currently working in the room with overlay avatars and real-time socket presence hooks.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-bg-base/50 rounded-3xl p-8 flex flex-col gap-5 border border-border-main/40 hover:-translate-y-2 transition-all duration-300 hover:shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main mb-2">Frictionless Share</h3>
                <p className="text-sm text-text-main/85 leading-relaxed font-sans font-medium">
                  No registrations or signup forms. Share the unique URL to let collaborators join instantly.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-bg-base/50 rounded-3xl p-8 flex flex-col gap-5 border border-border-main/40 hover:-translate-y-2 transition-all duration-300 hover:shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Save className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main mb-2">Auto Save Memory</h3>
                <p className="text-sm text-text-main/85 leading-relaxed font-sans font-medium">
                  Never lose a single character. Edits are cached and saved immediately in memory to handle connection drops.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-bg-base/50 rounded-3xl p-8 flex flex-col gap-5 border border-border-main/40 hover:-translate-y-2 transition-all duration-300 hover:shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-cyan-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main mb-2">Markdown Tools</h3>
                <p className="text-sm text-text-main/85 leading-relaxed font-sans font-medium">
                  Formatting buttons let you inject headers, lists, italics, bold tags, or export the document directly to a text file.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-bg-base/50 rounded-3xl p-8 flex flex-col gap-5 border border-border-main/40 hover:-translate-y-2 transition-all duration-300 hover:shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main mb-2">UUID Sandbox</h3>
                <p className="text-sm text-text-main/85 leading-relaxed font-sans font-medium">
                  Workspaces are sandboxed using secure, random 8-character hashes. Your note remains private unless shared.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Vertical Timeline Section */}
        <section id="workflow" className="px-6 py-32 max-w-4xl mx-auto w-full flex flex-col gap-16 relative">
          <div className="text-center flex flex-col items-center gap-4">
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-text-main">
              The Notepad Workflow
            </h2>
            <p className="text-base text-text-sub max-w-md">
              Start writing in seconds. Zero bloat, zero friction.
            </p>
          </div>

          <div className="relative border-l-2 border-dashed border-border-main/80 pl-10 md:pl-16 space-y-16 ml-4 md:ml-10">
            
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-[45px] md:-left-[69px] top-0 w-12 h-12 bg-paper rounded-full border-2 border-border-main flex items-center justify-center text-ink font-bold text-lg shadow-lg">1</div>
              <div className="bg-paper border border-border-main rounded-2xl p-8 shadow-xl hover:-translate-y-1 transition-transform">
                <h4 className="text-2xl font-bold text-text-main mb-3">Create Space</h4>
                <p className="text-sm text-text-sub leading-relaxed">Initialize a new notepad room dynamically with a single click. A unique sandboxed URL is generated instantly for your session.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-[45px] md:-left-[69px] top-0 w-12 h-12 bg-paper rounded-full border-2 border-border-main flex items-center justify-center text-ink font-bold text-lg shadow-lg">2</div>
              <div className="bg-paper border border-border-main rounded-2xl p-8 shadow-xl hover:-translate-y-1 transition-transform">
                <h4 className="text-2xl font-bold text-text-main mb-3">Share the URL</h4>
                <p className="text-sm text-text-sub leading-relaxed">Copy the room link from the browser bar or sharing popover. Send it to anyone you want to collaborate with.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-[45px] md:-left-[69px] top-0 w-12 h-12 bg-paper rounded-full border-2 border-border-main flex items-center justify-center text-ink font-bold text-lg shadow-lg">3</div>
              <div className="bg-paper border border-border-main rounded-2xl p-8 shadow-xl hover:-translate-y-1 transition-transform">
                <h4 className="text-2xl font-bold text-text-main mb-3">Co-Write Notes</h4>
                <p className="text-sm text-text-sub leading-relaxed">Collaborators join and write together. Cursor tracking and text synchronization updates in real-time across all connected clients.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-[45px] md:-left-[69px] top-0 w-12 h-12 bg-paper rounded-full border-2 border-border-main flex items-center justify-center text-ink font-bold text-lg shadow-lg">4</div>
              <div className="bg-paper border border-border-main rounded-2xl p-8 shadow-xl hover:-translate-y-1 transition-transform">
                <h4 className="text-2xl font-bold text-text-main mb-3">Download Offline</h4>
                <p className="text-sm text-text-sub leading-relaxed">Done writing? Export the document content into an offline Markdown note anytime directly to your local file system.</p>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-10 border-t border-border-main flex flex-col sm:flex-row items-center justify-between px-10 gap-6 text-sm text-text-sub z-10 bg-bg-base">
        <div className="flex items-center gap-3">
          <div className="text-ink">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-serif font-bold text-lg text-text-main">SyncPad</span>
        </div>
        
        <div>
          Built with ❤️ &bull; <a href="https://github.com/shinjansarkar" target="_blank" className="hover:text-ink underline transition-colors font-semibold">Shinjan</a> &amp; <a href="https://github.com/Smaranika2005" target="_blank" className="hover:text-ink underline transition-colors font-semibold">Smaranika</a>
        </div>

        <div>
          <a href="https://github.com/shinjansarkar/Collaborative-Notepad" target="_blank" className="hover:text-ink transition-colors flex items-center gap-2 font-semibold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            GitHub Project
          </a>
        </div>
      </footer>
    </div>
  );
}
