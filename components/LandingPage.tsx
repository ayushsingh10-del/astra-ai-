
import React from 'react';
import { Terminal, Cpu, Zap, Globe, ChevronRight, Shield, Code2, Activity, Scan, Disc, Aperture } from 'lucide-react';
import { Typewriter } from './Typewriter';
import { Logo } from './Logo';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen w-full relative flex flex-col bg-hex-pattern selection:bg-astra-saffron selection:text-black">
      
      {/* HUD CORNER BRACKETS */}
      <div className="fixed inset-4 pointer-events-none z-50 border border-white/5">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-astra-blue"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-astra-blue"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-astra-blue"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-astra-blue"></div>
        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 opacity-20">
           <div className="w-full h-px bg-white"></div>
           <div className="h-full w-px bg-white absolute top-0 left-1/2 -translate-x-1/2"></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-4 md:p-8">
        
        {/* --- HEADER: DATA STREAM STYLE --- */}
        <header className="flex justify-between items-end border-b border-white/10 pb-4 mb-10">
          <div className="flex items-center gap-4">
            <motion.div 
               initial={{ rotate: -90, opacity: 0 }}
               animate={{ rotate: 0, opacity: 1 }}
               className="relative"
            >
              <div className="absolute inset-0 bg-astra-blue blur-xl opacity-20"></div>
              <Logo className="w-16 h-16 relative z-10 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
            </motion.div>
            <div>
              <h1 className="font-orbitron text-3xl font-bold tracking-tighter text-white">ASTRA<span className="text-astra-saffron">.AI</span></h1>
              <div className="flex items-center gap-2 text-[10px] text-astra-blue font-tech tracking-[0.3em]">
                 <span>// CYBER-CORE</span>
                 <span className="animate-pulse">●</span>
                 <span>V.2.0.9</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block text-right font-tech text-xs text-gray-500">
            <div className="flex items-center justify-end gap-2">
              <div className="w-2 h-2 bg-astra-green animate-pulse"></div>
              <span>SYS.STATUS: OPTIMAL</span>
            </div>
            <div>LOC: INDIA_SECURE_SERVER</div>
            <div>UPTIME: 99.999%</div>
          </div>
        </header>

        {/* --- HERO SECTION: HOLOGRAPHIC PROJECTION --- */}
        <main className="flex-1 flex flex-col items-center justify-center text-center relative">
          
          {/* Decorative Data Strings */}
          <div className="absolute top-10 left-10 font-tech text-xs text-white/10 rotate-90 hidden md:block">
             0xFFA1 // MEMORY_ALLOC
          </div>
          <div className="absolute bottom-20 right-20 font-tech text-xs text-white/10 -rotate-90 hidden md:block">
             SECURE_PROTOCOL_INIT
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-8"
          >
             <div className="glitch-header font-orbitron text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600" data-text="CYBER-SENTINEL">
               CYBER-SENTINEL
             </div>
             <div className="h-1 w-32 bg-astra-saffron mx-auto mt-2 shadow-[0_0_15px_#FF9933]"></div>
          </motion.div>

          <div className="font-mono text-sm md:text-xl text-astra-blue/80 max-w-2xl mb-12 bg-black/50 backdrop-blur-sm p-4 border-l-2 border-astra-blue">
             <Typewriter text=">> INITIALIZING INDIAN CYBER-GUARDIAN... SYSTEM READY. UNAPOLOGETICALLY SAVAGE." speed={40} />
          </div>

          {/* REACTIVE ENERGY CELLS (Buttons) */}
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <motion.button
              onClick={() => { onStart(); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative w-64 h-16"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-astra-saffron to-red-500 clip-button opacity-70 blur-md group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-[2px] bg-black clip-button flex items-center justify-center gap-3 border border-astra-saffron/30 group-hover:bg-astra-saffron/10 transition-colors">
                 <Zap className="w-6 h-6 text-astra-saffron group-hover:text-white group-hover:animate-ping" />
                 <span className="font-orbitron font-bold text-xl text-astra-saffron group-hover:text-white tracking-widest transition-colors">INITIALIZE</span>
              </div>
              {/* Sparks */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
            </motion.button>
          </div>

        </main>

        {/* --- FEATURE GRID: HUD MODULES --- */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
          {[
            { icon: Terminal, label: "HACKER_MODE", sub: "TERMINAL_UI" },
            { icon: Code2, label: "GEMINI_CANVAS", sub: "CODE_SYNTHESIS" },
            { icon: Scan, label: "ASTRA_VISION", sub: "IMAGE_ANALYSIS" },
            { icon: Code2, label: "ASTRA_CODER", sub: "CANVAS_ENGINE" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="clip-hud bg-white/5 border border-white/10 p-6 hover:border-astra-saffron/50 hover:bg-astra-saffron/5 transition-all group cursor-pointer relative overflow-hidden"
            >
               {/* Scanning Effect inside card */}
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000"></div>
               
               <div className="flex items-center justify-between mb-4 opacity-50 group-hover:opacity-100">
                 <item.icon className="w-8 h-8 text-astra-blue group-hover:text-astra-saffron transition-colors" />
                 <span className="font-tech text-xs">MOD_0{i+1}</span>
               </div>
               <h3 className="font-orbitron font-bold text-white text-lg">{item.label}</h3>
               <p className="font-mono text-xs text-gray-500 mt-1">>> {item.sub}</p>
            </motion.div>
          ))}
        </section>

        {/* --- FOOTER: DATA LOG --- */}
        <footer className="mt-16 border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center font-tech text-xs text-gray-600 gap-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-astra-saffron/50 grayscale hover:grayscale-0 transition-all">
                 <Logo className="w-full h-full" />
              </div>
              <div>
                 <div className="text-white">ARCHITECT: AYUSH SINGH</div>
                 <div>RTMS SECURITY LAYER // ENCRYPTED</div>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <span>LAT: 20.5937° N</span>
              <span>LON: 78.9629° E</span>
              <span className="text-astra-saffron">MADE_IN_INDIA</span>
           </div>
        </footer>

      </div>
    </div>
  );
};
