
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Fingerprint, Hexagon, Zap, 
  ScanLine, Shield, Cpu, Target, Scan, 
  Database, AlertCircle, Search, CheckCircle2
} from 'lucide-react';

// Optimized Reusable Ring Component (SVG based for sharpness, CSS transform for performance)
const HudRing = ({ size, color, duration, reverse = false, opacity = 0.3, type = "solid" }: any) => {
    return (
        <motion.div 
            className="absolute top-1/2 left-1/2 pointer-events-none"
            style={{ 
                width: size, 
                height: size, 
                x: "-50%", 
                y: "-50%",
                border: type === 'solid' ? `1px solid ${color}` : 'none',
                borderRadius: '50%'
            }}
            animate={{ rotate: reverse ? -360 : 360 }}
            transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
        >
            {type === 'dashed' && (
                 <svg viewBox="0 0 100 100" className="w-full h-full rotate-90 overflow-visible">
                     <circle cx="50" cy="50" r="49" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="4 6" opacity={opacity} />
                 </svg>
            )}
            {type === 'ticks' && (
                 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                     <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="3" strokeDasharray="1 10" opacity={opacity} />
                 </svg>
            )}
             {type === 'segments' && (
                 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                     <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="1" strokeDasharray="20 40" opacity={opacity} />
                 </svg>
            )}
        </motion.div>
    );
};

export const AstraScanner: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    // Orchestrate the scanning timeline
    const t1 = setTimeout(() => setPhase(1), 800);  // Start visual scan
    const t2 = setTimeout(() => setPhase(2), 2500); // Deep analysis
    const t3 = setTimeout(() => setPhase(3), 5000); // Results
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden perspective-2000">
        
        {/* --- BACKGROUND AMBIANCE --- */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1)_0%,transparent_70%)] opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none transform perspective-1000 rotate-x-60" />

        {/* --- MAIN HUD CLUSTER --- */}
        <div className="relative w-full h-full flex items-center justify-center">
            
            {/* HOLOGRAPHIC RINGS (Optimized) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none scale-[0.6] md:scale-100">
                <HudRing size="65vh" color="#00F0FF" duration={60} type="dashed" opacity={0.3} />
                <HudRing size="55vh" color="#FF9933" duration={40} reverse type="ticks" opacity={0.4} />
                <HudRing size="45vh" color="#00F0FF" duration={25} type="segments" opacity={0.5} />
                <HudRing size="80vh" color="#00F0FF" duration={120} reverse type="solid" opacity={0.1} />
                
                {/* Static Crosshair Overlay */}
                <div className="absolute w-screen h-[1px] bg-gradient-to-r from-transparent via-astra-blue/30 to-transparent" />
                <div className="absolute h-screen w-[1px] bg-gradient-to-b from-transparent via-astra-blue/30 to-transparent" />
            </div>

            {/* --- CENTRAL CONTENT --- */}
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ type: "spring", stiffness: 100, damping: 20 }}
               className="relative z-10"
            >
                {/* Frame */}
                <div className="relative p-2 bg-black/60 border border-white/10 backdrop-blur-xl rounded-lg shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
                    
                    {/* Decorative Markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-astra-blue rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-astra-blue rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-astra-blue rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-astra-blue rounded-br-lg" />

                    {/* Image Display */}
                    <div className="relative max-h-[60vh] max-w-[90vw] overflow-hidden rounded">
                        <img 
                            src={imageUrl} 
                            className="w-full h-full object-contain block opacity-90"
                            style={{ filter: phase < 3 ? 'sepia(50%) hue-rotate(180deg) saturate(200%)' : 'none', transition: 'filter 1s' }}
                        />
                        
                        {/* Scanning Beam (Framer Motion for smoothness) */}
                        <AnimatePresence>
                            {phase < 3 && (
                                <motion.div 
                                    className="absolute inset-x-0 h-2 bg-astra-blue/80 shadow-[0_0_20px_#00F0FF] z-20"
                                    initial={{ top: "-10%" }}
                                    animate={{ top: "110%" }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-astra-blue to-transparent opacity-50 h-20" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Analysis Grid Overlay */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
                        <div className="absolute inset-0 z-10 pointer-events-none border-2 border-astra-blue/20 rounded box-border" />
                    </div>
                </div>

                {/* Floating Labels near Image */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                    className="absolute -top-8 left-0 font-tech text-[10px] text-astra-blue tracking-widest bg-black/80 px-2 py-1 border border-astra-blue/30"
                >
                    TARGET_ACQUIRED
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                    className="absolute -bottom-8 right-0 font-tech text-[10px] text-astra-saffron tracking-widest bg-black/80 px-2 py-1 border border-astra-saffron/30"
                >
                    {phase < 3 ? "SCANNING..." : "LOCKED"}
                </motion.div>
            </motion.div>

            {/* --- LEFT DATA PANEL --- */}
            <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-6 w-64"
            >
                <div className="bg-black/80 border-l-2 border-astra-blue p-4 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-astra-blue/10 blur-xl rounded-full -mr-10 -mt-10" />
                    <div className="flex items-center gap-2 mb-2 text-astra-blue font-orbitron text-xs">
                        <Cpu size={14} className="animate-spin-slow" /> CORE_PROCESS
                    </div>
                    <div className="space-y-3 font-tech text-[10px] text-gray-400">
                        <div className="flex justify-between">
                            <span>HEURISTICS</span>
                            <span className="text-white">ACTIVE</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-astra-blue" animate={{ width: ["30%", "80%", "45%"] }} transition={{ duration: 2, repeat: Infinity }} />
                        </div>
                        <div className="flex justify-between">
                            <span>NEURAL_LAYER</span>
                            <span className="text-astra-saffron">V.9.0</span>
                        </div>
                    </div>
                </div>

                <div className="bg-black/80 border-l-2 border-astra-saffron p-4 backdrop-blur-md font-mono text-[9px] text-gray-500 h-32 overflow-hidden flex flex-col justify-end">
                    <div className="text-astra-saffron mb-2 font-bold flex items-center gap-2"><Search size={10} /> LIVE_LOG</div>
                    {phase >= 0 && <motion.div initial={{opacity:0}} animate={{opacity:1}}> > INIT_PROTOCOL_33 </motion.div>}
                    {phase >= 1 && <motion.div initial={{opacity:0}} animate={{opacity:1}}> > PIXEL_DENSITY_CHK... OK </motion.div>}
                    {phase >= 1 && <motion.div initial={{opacity:0}} animate={{opacity:1}}> > FACE_MAPPING... <span className="text-green-500">COMPLETE</span> </motion.div>}
                    {phase >= 2 && <motion.div initial={{opacity:0}} animate={{opacity:1}}> > ARTIFACT_DETECTION... </motion.div>}
                    <motion.div animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity }}>_</motion.div>
                </div>
            </motion.div>

            {/* --- RIGHT DATA PANEL --- */}
            <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-6 w-64 text-right"
            >
                <div className="bg-black/80 border-r-2 border-astra-blue p-4 backdrop-blur-md relative overflow-hidden">
                    <div className="flex justify-end items-center gap-2 mb-2 text-astra-blue font-orbitron text-xs">
                        INTEGRITY_SCORE <Shield size={14} />
                    </div>
                    <div className="font-orbitron text-4xl font-bold text-white tracking-tighter">
                        {phase < 3 ? (
                            <span className="flex items-center justify-end gap-1">
                                <span className="text-2xl opacity-50">CALC</span>
                                <span className="animate-pulse">...</span>
                            </span>
                        ) : (
                            <motion.span initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-astra-blue drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                                99.9%
                            </motion.span>
                        )}
                    </div>
                </div>

                <div className="bg-black/80 border-r-2 border-white/20 p-4 backdrop-blur-md">
                     <div className="font-tech text-[10px] text-gray-400 space-y-2">
                         <div className="p-1 border border-white/10 rounded bg-white/5 flex justify-between px-2">
                             <span>GAN_CHECK</span>
                             {phase > 1 ? <CheckCircle2 size={12} className="text-green-500" /> : <div className="w-3 h-3 border border-gray-500 rounded-full animate-spin"></div>}
                         </div>
                         <div className="p-1 border border-white/10 rounded bg-white/5 flex justify-between px-2">
                             <span>META_EXIF</span>
                             {phase > 1 ? <CheckCircle2 size={12} className="text-green-500" /> : <div className="w-3 h-3 border border-gray-500 rounded-full animate-spin"></div>}
                         </div>
                         <div className="p-1 border border-white/10 rounded bg-white/5 flex justify-between px-2">
                             <span>NOISE_PRINT</span>
                             {phase > 2 ? <CheckCircle2 size={12} className="text-green-500" /> : <div className="w-3 h-3 border border-gray-500 rounded-full animate-spin"></div>}
                         </div>
                     </div>
                </div>
            </motion.div>

            {/* --- BOTTOM STATUS BAR --- */}
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-12 flex items-center gap-4 px-8 py-3 bg-black/70 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl"
            >
                <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${phase === 3 ? 'bg-green-500 shadow-[0_0_10px_#00FF41]' : 'bg-astra-saffron shadow-[0_0_10px_#FF9933] animate-pulse'}`} />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-current opacity-50 animate-ping" />
                </div>
                <div className="flex flex-col">
                    <span className="font-orbitron text-xs font-bold text-white tracking-[0.2em]">
                        {phase === 0 ? "SYSTEM_INIT" : phase === 1 ? "VISUAL_SCAN" : phase === 2 ? "DEEP_ANALYSIS" : "VERIFIED"}
                    </span>
                    <span className="font-tech text-[9px] text-astra-blue">
                         PROCESS_ID: {Math.floor(Math.random() * 99999)} // THREAD_PRIORITY: HIGH
                    </span>
                </div>
            </motion.div>

        </div>
    </div>
  );
};
