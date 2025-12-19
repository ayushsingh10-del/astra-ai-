
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Send, Mic, Image as ImageIcon, Terminal, X, 
  Activity, ChevronLeft, LayoutGrid, BrainCircuit, 
  Globe, Zap, ScanEye, Wand2, Paperclip, Shield, Skull, Cpu, 
  Volume2, VolumeX, Trash2, Radio, StopCircle, Settings2, ChevronDown,
  AlertTriangle, CheckCircle2, Flame, Search, ScanLine, Code2, Copy, Check, Download, StopCircle as StopIcon
} from 'lucide-react';
import { Message, Role, CodeSnippet, Attachment, GenerationMode, AstraMode, VoiceSettings, GroundingMetadata } from '../types';
import { 
  sendMessageToGemini, 
  initializeChat, 
  generateEditedImage, 
  runAstraDetection,
  speakText,
  AstraLiveSession
} from '../services/geminiService';
import { 
  INITIAL_GREETING_SHIELD, 
  INITIAL_GREETING_SKULL, 
  INITIAL_GREETING_ROOT 
} from '../constants';
import ReactMarkdown from 'react-markdown';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { Typewriter } from './Typewriter';
import { AstraScanner } from './AstraScanner';
import { MatrixRain } from './MatrixRain';
import { VoiceVisualizer } from './VoiceVisualizer';
import { Tooltip } from './Tooltip';
import { Content } from '@google/genai';

interface ChatInterfaceProps {
  onBack: () => void;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
    shield: { pitch: 1.0, rate: 1.0, voiceURI: '' },
    skull: { pitch: 0.1, rate: 0.6, voiceURI: '' }, // Default Demon
    root: { pitch: 0.8, rate: 1.4, voiceURI: '' } // Default Robot
};

// Analysis function to detect if query requires live web data
const detectNewsIntent = (text: string): boolean => {
    const keywords = [
        "news", "latest", "recent", "update", "current", "today", "now",
        "weather", "forecast", "stock", "price", "crypto", "market", "score", "winner",
        "election", "schedule", "when is", "who won", "what happened", "live", "vs", "match", "game"
    ];
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
};

// Helper to convert internal Message type to Gemini Content type for history preservation
// Optimized with early returns
const getHistoryForGemini = (msgs: Message[]): Content[] => {
    const filtered: Content[] = [];
    for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i];
        if (m.id !== 'init' && !m.text.startsWith('>> IMAGE_GENERATED')) {
            filtered.push({ 
                role: m.role === Role.USER ? 'user' : 'model', 
                parts: [{ text: m.text }] 
            });
        }
    }
    return filtered;
};

// --- SPECIALIZED FORENSIC RESULT COMPONENT ---
const ForensicResultDisplay = React.memo(({ text }: { text: string }) => {
  const anomalyMatch = text.match(/\[ANOMALIES_DETECTED\]([\s\S]*?)\[FORENSIC_REPORT\]/);
  const reportMatch = text.match(/\[FORENSIC_REPORT\]([\s\S]*?)\[CONCLUSION\]/);
  const conclusionMatch = text.match(/\[CONCLUSION\]([\s\S]*)/);

  const anomalies = anomalyMatch ? anomalyMatch[1].trim().split('\n').map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean) : [];
  const report = reportMatch ? reportMatch[1].trim() : "";
  const conclusion = conclusionMatch ? conclusionMatch[1].trim() : "";
  
  if (!anomalyMatch && !reportMatch && !conclusionMatch) {
      return (
        <div className="flex flex-col gap-2">
           <div className="text-xs font-mono text-astra-blue animate-pulse">>> DECRYPTING_FORENSIC_DATA...</div>
           <div className="opacity-50 text-[10px] whitespace-pre-wrap font-mono">{text}</div>
        </div>
      );
  }

  // Determine alert level based on verdict
  const isDanger = conclusion.toLowerCase().includes('ai_generated') || conclusion.toLowerCase().includes('fake') || conclusion.toLowerCase().includes('ai_modified');
  const isClean = conclusion.toLowerCase().includes('original') && !isDanger;

  return (
    <div className="space-y-4 w-full mt-2">
        <div className="space-y-2">
            <div className="text-[10px] font-orbitron text-astra-saffron tracking-widest flex items-center gap-2 border-b border-astra-saffron/20 pb-1">
                <AlertTriangle size={12} /> DETECTED_ANOMALIES
            </div>
            {anomalies.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                    {anomalies.map((anomaly, idx) => (
                        <motion.div 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx} 
                            className="bg-red-500/10 border-l-2 border-red-500 p-2 text-xs font-mono text-red-200 flex items-start gap-2 rounded-r"
                        >
                           <ScanLine size={14} className="shrink-0 text-red-500 mt-0.5" />
                           <span>{anomaly}</span>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-xs text-gray-500 italic">No significant anomalies flagged yet...</div>
            )}
        </div>
        {report && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
                 <div className="text-[10px] font-orbitron text-astra-blue tracking-widest mb-2 flex items-center gap-2">
                    <Search size={12} /> FORENSIC_ANALYSIS
                 </div>
                 <div className="prose prose-invert text-sm font-light text-gray-300 leading-relaxed">
                     <ReactMarkdown>{report}</ReactMarkdown>
                 </div>
            </motion.div>
        )}
        {conclusion && (
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative overflow-hidden rounded-xl border p-4 ${isDanger ? 'border-red-500/50 bg-red-950/30' : 'border-green-500/50 bg-green-950/30'}`}
            >
                 <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
                 <div className="relative z-10">
                    <div className="text-[10px] font-orbitron text-white tracking-widest mb-2 flex items-center gap-2">
                        <Shield size={12} /> FINAL_VERDICT
                    </div>
                    <div className="font-mono text-sm font-bold whitespace-pre-wrap">
                        {conclusion.split('\n').map((line, i) => (
                            <div key={i} className={line.includes('VERDICT') ? `text-lg mb-2 tracking-wide ${isDanger ? 'text-red-400' : 'text-green-400'}` : 'text-gray-300'}>{line}</div>
                        ))}
                    </div>
                 </div>
            </motion.div>
        )}
    </div>
  );
});


export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [genMode, setGenMode] = useState<GenerationMode>('CHAT');
  const [astraMode, setAstraMode] = useState<AstraMode>('shield'); 
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [featureMenuOpen, setFeatureMenuOpen] = useState(false);
  const [personalityMenuOpen, setPersonalityMenuOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [scanningImage, setScanningImage] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);
  const liveSessionRef = useRef<AstraLiveSession | null>(null);
  const personalityMenuRef = useRef<HTMLDivElement>(null);
  const lastReadMessageId = useRef<string | null>(null);
  
  // --- INIT & LOAD HISTORY ---
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const savedHistory = localStorage.getItem('ASTRA_HISTORY');
    const savedAstraMode = localStorage.getItem('ASTRA_MODE') as AstraMode;
    const savedGenMode = localStorage.getItem('ASTRA_GEN_MODE') as GenerationMode;
    const savedVoiceSettings = localStorage.getItem('ASTRA_VOICE_SETTINGS');

    if(savedVoiceSettings) {
        try {
            setVoiceSettings(JSON.parse(savedVoiceSettings));
        } catch(e) { console.error("Error loading voice settings", e); }
    }

    if (savedHistory && savedAstraMode) {
       try {
           const parsedMsgs = JSON.parse(savedHistory);
           setMessages(parsedMsgs);
           setAstraMode(savedAstraMode);
           if(savedGenMode) setGenMode(savedGenMode);
           
           const history = getHistoryForGemini(parsedMsgs);
           initializeChat(savedGenMode || 'CHAT', savedAstraMode, history);
       } catch (e) {
           console.error("Corrupt History", e);
           startFreshSession('shield', 'CHAT');
       }
    } else {
       startFreshSession('shield', 'CHAT');
    }

    // Cleanup audio on unmount
    return () => {
         speakText('', 'shield', undefined, true);
    }

  }, []);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (personalityMenuRef.current && !personalityMenuRef.current.contains(event.target as Node)) {
              setPersonalityMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced localStorage save for better performance
  useEffect(() => {
     if (!isInitialized.current) return;
     
     const timeoutId = setTimeout(() => {
        localStorage.setItem('ASTRA_HISTORY', JSON.stringify(messages));
        localStorage.setItem('ASTRA_MODE', astraMode);
        localStorage.setItem('ASTRA_GEN_MODE', genMode);
        localStorage.setItem('ASTRA_VOICE_SETTINGS', JSON.stringify(voiceSettings));
     }, 500); // Debounce by 500ms
     
     return () => clearTimeout(timeoutId);
  }, [messages, astraMode, genMode, voiceSettings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time audio polling for Live Session
  useEffect(() => {
    let animationFrame: number;
    const update = () => {
      if (isLiveMode && liveSessionRef.current) {
        setAudioData(liveSessionRef.current.getFrequencyData());
        animationFrame = requestAnimationFrame(update);
      }
    };
    if (isLiveMode) {
      update();
    } else {
      setAudioData(new Uint8Array(0));
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isLiveMode]);

  useEffect(() => {
      if (isVoiceEnabled && !isLoading && messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.id === lastReadMessageId.current) return;

          if (lastMsg.role === Role.MODEL && lastMsg.id !== 'init') {
             lastReadMessageId.current = lastMsg.id;
             // Auto Speak with active state tracking
             setSpeakingMessageId(lastMsg.id);
             speakText(lastMsg.text, astraMode, voiceSettings[astraMode], false, () => {
                 setSpeakingMessageId(prev => prev === lastMsg.id ? null : prev);
             });
          }
      } else if (!isVoiceEnabled) {
          speakText('', astraMode, undefined, true);
          setSpeakingMessageId(null);
      }
  }, [messages, isVoiceEnabled, isLoading, astraMode, voiceSettings]);

  const startFreshSession = useCallback((newAstraMode: AstraMode, newGenMode: GenerationMode) => {
      initializeChat(newGenMode, newAstraMode);
      
      let greeting = INITIAL_GREETING_SHIELD;
      if (newAstraMode === 'skull') greeting = INITIAL_GREETING_SKULL;
      if (newAstraMode === 'root') greeting = INITIAL_GREETING_ROOT;

      setMessages([{
        id: 'init',
        role: Role.MODEL,
        text: greeting,
        timestamp: Date.now()
      }]);
  }, []);

  const switchProtocol = useCallback((newMode: AstraMode) => {
      setAstraMode(newMode);
      startFreshSession(newMode, genMode);
  }, [genMode, startFreshSession]);

  const switchGenMode = useCallback((newMode: GenerationMode) => {
      setGenMode(newMode);
      setFeatureMenuOpen(false);
      startFreshSession(astraMode, newMode);
  }, [astraMode, startFreshSession]);

  const clearHistory = useCallback(() => {
      localStorage.removeItem('ASTRA_HISTORY');
      localStorage.removeItem('ASTRA_MODE');
      localStorage.removeItem('ASTRA_GEN_MODE');
      startFreshSession(astraMode, genMode);
  }, [astraMode, genMode, startFreshSession]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setAttachment({
                      file,
                      previewUrl: URL.createObjectURL(file),
                      base64: (ev.target.result as string).split(',')[1],
                      mimeType: file.type
                  });
              }
          };
          reader.readAsDataURL(file);
      }
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleSpeakToggle = useCallback((text: string, id: string) => {
      if (speakingMessageId === id) {
          // Stop
          speakText('', astraMode, undefined, true);
          setSpeakingMessageId(null);
      } else {
          // Play
          setSpeakingMessageId(id);
          speakText(text, astraMode, voiceSettings[astraMode], false, () => {
              setSpeakingMessageId(prev => prev === id ? null : prev);
          });
      }
  }, [speakingMessageId, astraMode, voiceSettings]);

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      image: attachment?.previewUrl,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentAttachment = attachment;
    setAttachment(null);
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    const updateModelMsg = (text: string) => {
        setMessages(prev => {
            const exists = prev.find(m => m.id === modelMsgId);
            if (exists) return prev.map(m => m.id === modelMsgId ? { ...m, text } : m);
            return [...prev, { id: modelMsgId, role: Role.MODEL, text, timestamp: Date.now() }];
        });
    };
    
    // Callback kept for API compatibility but UI does not use metadata
    const updateMetadata = (metadata: GroundingMetadata) => {
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, groundingMetadata: metadata } : m));
    };

    try {
        if (genMode === 'IMAGE_EDIT') {
            updateModelMsg('>> RENDERING_VISUAL_DATA...');
            const imgBase64 = await generateEditedImage(userMsg.text, currentAttachment?.base64, currentAttachment?.mimeType);
            if (imgBase64) {
                setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: ">> IMAGE_GENERATED.", image: imgBase64 } : m));
            } else {
                updateModelMsg(">> ERROR: RENDER FAILED.");
            }
        } else if (genMode === 'ASTRA_DETECTION') {
            if (currentAttachment) {
                setScanningImage(currentAttachment.previewUrl);
                const detectionPromise = runAstraDetection(currentAttachment, updateModelMsg);
                const minTimePromise = new Promise(resolve => setTimeout(resolve, 3500));
                const [result] = await Promise.all([detectionPromise, minTimePromise]);
                updateModelMsg(result);
            } else {
                 updateModelMsg(">> SYSTEM_ALERT: NO MEDIA DETECTED. PLEASE UPLOAD AN IMAGE FOR FORENSIC ANALYSIS.");
            }
        } else {
            let effectiveGenMode = genMode;
            if (genMode === 'CHAT' && !currentAttachment && detectNewsIntent(userMsg.text)) {
                effectiveGenMode = 'WEB_INTEL';
            }

            if (astraMode === 'root') {
                updateModelMsg('> [EXECUTING_ROOT_COMMAND]...');
            } else if (effectiveGenMode === 'WEB_INTEL' && genMode === 'CHAT') {
                updateModelMsg('Let me check the latest information for you... 🔍\n\n');
            }

            const currentHistory = getHistoryForGemini([...messages, userMsg]);
            await sendMessageToGemini(
                userMsg.text, 
                currentAttachment, 
                effectiveGenMode, 
                astraMode, 
                updateModelMsg, 
                updateMetadata,
                currentHistory
            );
        }
    } catch (error) {
        updateModelMsg(">> SYSTEM FAILURE.");
    }
    setIsLoading(false);
    setScanningImage(null);
  };

  const toggleLiveSession = useCallback(() => {
      if (isLiveMode) {
          liveSessionRef.current?.stop();
          liveSessionRef.current = null;
          setIsLiveMode(false);
      } else {
          setIsLiveMode(true);
          const session = new AstraLiveSession(astraMode);
          session.start(() => {
              setIsLiveMode(false);
              liveSessionRef.current = null;
          });
          liveSessionRef.current = session;
      }
  }, [isLiveMode, astraMode]);

  const getModeIcon = useCallback((m: GenerationMode) => {
      switch(m) {
          case 'DEEP_THINK': return BrainCircuit;
          case 'WEB_INTEL': return Globe;
          case 'SPEED_RUN': return Zap;
          case 'IMAGE_EDIT': return ImageIcon;
          case 'ASTRA_DETECTION': return ScanEye;
          case 'ASTRA_CODER': return Code2;
          default: return Terminal;
      }
  }, []);

  const getThemeClasses = useMemo(() => {
      switch(astraMode) {
          case 'skull': return 'bg-red-950 text-red-100 font-sans'; 
          case 'root': return 'bg-black text-red-500 font-terminal crt-scanlines'; 
          default: return 'bg-black text-white font-sans';
      }
  }, [astraMode]);

  const features = useMemo(() => [
      { id: 'CHAT', label: 'CORE CHAT', desc: 'Standard Astra Intelligence', icon: Terminal },
      { id: 'DEEP_THINK', label: 'DEEP REASONING', desc: 'Complex Problem Solving (High IQ)', icon: BrainCircuit },
      { id: 'WEB_INTEL', label: 'WEB INTEL', desc: 'Live Internet Access & Search', icon: Globe },
      { id: 'SPEED_RUN', label: 'SPEED RUN', desc: 'Lightning Fast Responses', icon: Zap },
      { id: 'IMAGE_EDIT', label: 'VISION EDIT', desc: 'Modify Images via Prompt', icon: ImageIcon },
      { id: 'ASTRA_DETECTION', label: 'AI DETECTOR', desc: 'Forensic Image Analysis', icon: ScanEye },
      { id: 'ASTRA_CODER', label: 'ASTRA CODER', desc: 'Gemini Canvas Style Dev', icon: Code2 }, 
  ], []);

  const CurrentModeIcon = useMemo(() => getModeIcon(genMode), [genMode, getModeIcon]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col h-[100dvh] w-full overflow-hidden ${getThemeClasses}`}>
      
      {astraMode === 'root' && (
          <>
             <MatrixRain />
             <div className="fixed inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none animate-pulse">
                <Logo className="w-[500px] h-[500px]" isHackerMode={true} />
             </div>
             <div className="fixed inset-0 bg-red-500/5 z-0 pointer-events-none animate-pulse"></div>
          </>
      )}

      {/* --- HEADER --- */}
      <header className={`relative z-50 flex flex-col ${astraMode === 'root' ? 'bg-black/90' : 'bg-black/60 backdrop-blur-xl'} border-b border-white/10 transition-colors duration-500`}>
        
        <div className="flex items-center justify-between p-3 relative">
            {/* LEFT: LOGO & BACK */}
            <div className="flex items-center gap-3 w-1/4">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Logo className="w-8 h-8" isHackerMode={astraMode === 'root'} />
                </button>
            </div>

            {/* CENTER: FEATURE DROPDOWN */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                 <div className="relative">
                    <button 
                    onClick={() => setFeatureMenuOpen(!featureMenuOpen)}
                    className={`flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/10 hover:border-astra-blue/50 transition-all group backdrop-blur-md shadow-lg ${astraMode === 'root' ? 'bg-red-900/40 text-red-500' : 'bg-white/5 text-astra-blue'}`}
                    >
                        <CurrentModeIcon size={18} className="group-hover:animate-pulse text-astra-saffron" />
                        <span className="font-orbitron text-xs font-bold tracking-wider hidden sm:inline-block">{genMode.replace('_', ' ')}</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 opacity-60 ${featureMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {featureMenuOpen && (
                            <>
                            <div className="fixed inset-0 z-40" onClick={() => setFeatureMenuOpen(false)}></div>
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95, x: "-50%" }}
                              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                              exit={{ opacity: 0, y: -10, scale: 0.95, x: "-50%" }}
                              className="absolute top-full left-1/2 mt-3 w-[280px] sm:w-[320px] bg-[#050505]/95 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col z-50"
                            >
                                <div className="px-5 py-3 bg-white/5 text-[10px] font-orbitron tracking-widest text-gray-400 uppercase border-b border-white/10 flex items-center justify-between">
                                    <span>Select Protocol</span>
                                    <Activity size={12} className="text-astra-blue" />
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {features.map((f) => (
                                        <button
                                          key={f.id}
                                          onClick={() => switchGenMode(f.id as GenerationMode)}
                                          className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all text-left border border-transparent group ${genMode === f.id ? 'bg-astra-blue/10 border-astra-blue/30' : 'hover:bg-white/5 hover:border-white/10'}`}
                                        >
                                            <div className={`p-2 rounded-lg ${genMode === f.id ? 'bg-astra-saffron text-black' : 'bg-white/10 text-gray-400 group-hover:text-white'}`}>
                                                <f.icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-orbitron text-xs font-bold tracking-wide ${genMode === f.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {f.label}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-tech leading-tight mt-0.5 group-hover:text-gray-400">
                                                    {f.desc}
                                                </div>
                                            </div>
                                            {genMode === f.id && <div className="w-1.5 h-1.5 rounded-full bg-astra-saffron shadow-[0_0_8px_#FF9933]"></div>}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                 </div>
            </div>

            {/* RIGHT: TOOLS */}
            <div className="flex items-center justify-end gap-2 w-1/4">
                <Tooltip content="WIPE MEMORY" position="bottom">
                    <button 
                        onClick={clearHistory}
                        className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 sm:py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/60 text-red-500 rounded-lg transition-all"
                    >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline ml-2 text-[10px] font-orbitron tracking-widest">PURGE</span>
                    </button>
                </Tooltip>

                <Tooltip content={isVoiceEnabled ? "MUTE VOICE" : "ENABLE VOICE"} position="bottom">
                    <button 
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`p-2 rounded-lg transition-all border border-transparent ${isVoiceEnabled ? 'bg-astra-saffron text-black shadow-[0_0_10px_#FF9933]' : 'bg-white/5 text-gray-400 hover:text-white hover:border-white/20'}`}
                    >
                        {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                </Tooltip>
            </div>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </header>

      {/* --- MAIN CHAT AREA --- */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth pb-32">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${msg.role === Role.USER ? 'items-end' : 'items-start'} gap-1`}
          >
            {/* Message Bubble/Content */}
            <div className={`max-w-[85%] md:max-w-[70%] group relative ${
                msg.role === Role.USER 
                 ? 'bg-[#2f2f2f] text-white rounded-[24px] px-5 py-3 rounded-br-none' 
                 : 'bg-transparent text-white px-0 py-0'
            }`}>
                
                {/* Attachments */}
                {msg.image && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-white/10 max-w-sm relative group/image">
                        <img src={msg.image} alt="Visual Data" className="w-full object-cover" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                             <button 
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = msg.image!;
                                    link.download = `astra-vision-${Date.now()}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="p-2 bg-black/50 hover:bg-astra-saffron hover:text-black text-white rounded-lg border border-white/20 backdrop-blur-md transition-all shadow-lg"
                                title="Download Output"
                             >
                                 <Download size={16} />
                             </button>
                        </div>
                    </div>
                )}

                {/* Text Content */}
                <div className={`prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 ${astraMode === 'root' ? 'font-terminal text-lg text-green-500' : 'font-light text-base'}`}>
                   {msg.text.includes('[ANOMALIES_DETECTED]') ? (
                       <ForensicResultDisplay text={msg.text} />
                   ) : (
                       msg.id === messages[messages.length - 1].id && msg.role === Role.MODEL && isLoading ? (
                           <Typewriter text={msg.text} speed={astraMode === 'root' ? 5 : 15} />
                       ) : (
                           <ReactMarkdown
                            components={{
                                code({className, children, ...props}) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return match ? (
                                        <div className="relative group/code my-4">
                                            <div className="absolute -top-3 left-2 px-2 bg-gray-800 text-[10px] text-gray-400 rounded border border-gray-700 font-mono">
                                                {match[1].toUpperCase()}
                                            </div>
                                            <div className="bg-[#0d0d0d] p-4 rounded-lg border border-white/10 overflow-x-auto">
                                                <code className={`!bg-transparent text-sm font-mono text-gray-300 ${className}`} {...props}>
                                                    {children}
                                                </code>
                                            </div>
                                        </div>
                                    ) : (
                                        <code className="bg-white/10 px-1 py-0.5 rounded text-astra-saffron font-mono text-xs" {...props}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                           >
                               {msg.text}
                           </ReactMarkdown>
                       )
                   )}
                </div>
            </div>

            {/* Footer Actions (Only for Model) */}
            {msg.role === Role.MODEL && (
                <div className="flex items-center gap-4 px-1 mt-1 opacity-60 text-gray-400">
                    <button onClick={() => handleCopy(msg.text, msg.id)} className="hover:text-white transition-colors">
                        {copiedId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                    <button 
                        onClick={() => handleSpeakToggle(msg.text, msg.id)} 
                        className={`transition-colors ${speakingMessageId === msg.id ? 'text-astra-saffron animate-pulse' : 'hover:text-white'}`}
                    >
                        {speakingMessageId === msg.id ? <StopIcon size={14} /> : <Volume2 size={14} />}
                    </button>
                    <span className="text-[10px] font-sans pt-0.5">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}
            
            {/* Timestamp for User */}
            {msg.role === Role.USER && (
                <div className="text-[10px] text-gray-500 mr-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            )}

          </motion.div>
        ))}
        
        {isLoading && (
            <div className="flex justify-start">
               <div className="flex items-center gap-1 h-6 px-1">
                   <div className="w-1.5 h-1.5 bg-astra-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-1.5 h-1.5 bg-astra-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-1.5 h-1.5 bg-astra-blue rounded-full animate-bounce"></div>
               </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* --- LIVE VISUALIZER OVERLAY --- */}
      <AnimatePresence>
          {isLiveMode && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[60]"
              >
                  <VoiceVisualizer data={audioData} color={astraMode === 'root' ? "astra-green" : "astra-saffron"} count={24} />
              </motion.div>
          )}
      </AnimatePresence>

      {/* --- INPUT AREA --- */}
      <div className={`p-4 ${astraMode === 'root' ? 'bg-black border-t-2 border-green-500' : 'bg-black/60 backdrop-blur-xl border-t border-white/10'}`}>
         
         {/* ATTACHMENT PREVIEW */}
         <AnimatePresence>
             {attachment && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className="absolute bottom-full left-4 mb-4 bg-gray-900 border border-white/20 p-2 rounded-lg flex items-center gap-3"
                 >
                     <div className="w-10 h-10 rounded overflow-hidden">
                         <img src={attachment.previewUrl} className="w-full h-full object-cover" />
                     </div>
                     <div className="text-xs max-w-[150px] truncate">{attachment.file.name}</div>
                     <button onClick={() => setAttachment(null)} className="p-1 hover:bg-white/20 rounded-full"><X size={14} /></button>
                 </motion.div>
             )}
         </AnimatePresence>

         <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3 items-end">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />

            {/* PERSONALITY SWITCHER */}
            <div className="relative" ref={personalityMenuRef}>
               <Tooltip content="IDENTITY MATRIX" position="top" disabled={personalityMenuOpen}>
                   <motion.button 
                      layout
                      onClick={() => setPersonalityMenuOpen(!personalityMenuOpen)}
                      className={`p-3 rounded-xl transition-colors border relative overflow-hidden ${
                          astraMode === 'skull' ? 'border-red-500/50 text-red-500 bg-red-500/10' :
                          astraMode === 'root' ? 'border-green-500/50 text-green-500 bg-green-500/10' :
                          'border-white/10 text-astra-blue bg-white/5 hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                   >
                       <AnimatePresence mode="wait" initial={false}>
                           <motion.div
                               key={astraMode}
                               initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                               animate={{ opacity: 1, scale: 1, rotate: 0 }}
                               exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                               transition={{ duration: 0.2 }}
                           >
                               {astraMode === 'shield' && <Shield size={20} />}
                               {astraMode === 'skull' && <Skull size={20} />}
                               {astraMode === 'root' && <Terminal size={20} />}
                           </motion.div>
                       </AnimatePresence>
                   </motion.button>
               </Tooltip>

               <AnimatePresence>
                  {personalityMenuOpen && (
                      <motion.div 
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: -10, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute bottom-full left-0 mb-2 w-56 bg-[#0a0a0a] border border-white/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 flex flex-col backdrop-blur-xl"
                      >
                          <div className="px-4 py-3 text-[10px] text-gray-500 font-orbitron tracking-widest border-b border-white/10 bg-white/5">
                              PERSONALITY MATRIX
                          </div>
                          
                          <motion.button 
                             whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", x: 4 }}
                             onClick={() => { switchProtocol('shield'); setPersonalityMenuOpen(false); }}
                             className={`flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-white/5 w-full ${astraMode === 'shield' ? 'text-astra-blue' : 'text-gray-400'}`}
                          >
                              <Shield size={16} />
                              <div className="flex-1">
                                  <div className="font-bold text-xs">SHIELD</div>
                                  <div className="text-[10px] opacity-60">Standard Defense</div>
                              </div>
                              {astraMode === 'shield' && (
                                  <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-astra-blue" />
                              )}
                          </motion.button>

                          <motion.button 
                             whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)", x: 4 }}
                             onClick={() => { switchProtocol('skull'); setPersonalityMenuOpen(false); }}
                             className={`flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-white/5 w-full ${astraMode === 'skull' ? 'text-red-500' : 'text-gray-400'}`}
                          >
                              <Flame size={16} />
                              <div className="flex-1">
                                  <div className="font-bold text-xs">ROAST / SKULL</div>
                                  <div className="text-[10px] opacity-60">Toxic & Savage</div>
                              </div>
                              {astraMode === 'skull' && (
                                  <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              )}
                          </motion.button>

                          <motion.button 
                             whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.1)", x: 4 }}
                             onClick={() => { switchProtocol('root'); setPersonalityMenuOpen(false); }}
                             className={`flex items-center gap-3 px-4 py-3 transition-colors text-left w-full ${astraMode === 'root' ? 'text-green-500' : 'text-gray-400'}`}
                          >
                              <Terminal size={16} />
                              <div className="flex-1">
                                  <div className="font-bold text-xs">ROOT SHELL</div>
                                  <div className="text-[10px] opacity-60">Hacker CLI</div>
                              </div>
                              {astraMode === 'root' && (
                                  <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              )}
                          </motion.button>
                      </motion.div>
                  )}
               </AnimatePresence>
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-xl transition-colors ${astraMode === 'root' ? 'border border-green-500 text-green-500 hover:bg-green-500/20' : 'bg-white/5 text-gray-400 hover:text-astra-blue hover:bg-white/10'}`}
            >
                <Paperclip size={20} />
            </button>
            
            <button
               onClick={toggleLiveSession}
               className={`p-3 rounded-xl transition-all relative ${isLiveMode ? 'bg-red-500 text-white animate-pulse' : astraMode === 'root' ? 'border border-green-500 text-green-500 hover:bg-green-500/20' : 'bg-white/5 text-gray-400 hover:text-astra-blue hover:bg-white/10'}`}
            >
                {isLiveMode ? <StopCircle size={20} /> : <Radio size={20} />}
            </button>

             {/* DEEP THINK TOGGLE BUTTON */}
             <Tooltip content={genMode === 'DEEP_THINK' ? "DEEP THINKING ACTIVE" : "ENABLE DEEP REASONING"} position="top">
                <button
                    onClick={() => switchGenMode(genMode === 'DEEP_THINK' ? 'CHAT' : 'DEEP_THINK')}
                    className={`p-3 rounded-xl transition-all relative ${
                        genMode === 'DEEP_THINK' 
                        ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' 
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    {genMode === 'DEEP_THINK' ? <BrainCircuit size={20} className="animate-pulse" /> : <Zap size={20} />}
                </button>
            </Tooltip>

            <motion.div 
              animate={{ 
                  borderColor: isInputFocused 
                      ? (astraMode === 'root' ? '#22c55e' : (astraMode === 'skull' ? '#ef4444' : 'rgba(0, 240, 255, 0.5)')) 
                      : (astraMode === 'root' ? '#15803d' : 'rgba(255, 255, 255, 0.05)'),
                  boxShadow: isInputFocused 
                      ? (astraMode === 'root' ? '0 0 10px rgba(34, 197, 94, 0.3)' : (astraMode === 'skull' ? '0 0 10px rgba(239, 68, 68, 0.3)' : '0 0 15px rgba(0, 240, 255, 0.2)'))
                      : 'none',
                  scale: isInputFocused ? 1.01 : 1
              }}
              transition={{ duration: 0.2 }}
              className={`flex-1 flex items-center gap-2 p-3 rounded-xl border ${astraMode === 'root' ? 'bg-black' : 'bg-white/5'}`}
            >
                {astraMode === 'root' && <span className="text-green-500 font-terminal mr-1">{'>'}</span>}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={(e) => {
                      if(e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                      }
                  }}
                  placeholder={astraMode === 'skull' ? "Say something stupid..." : astraMode === 'root' ? "ENTER_COMMAND_MATRIX..." : "Message Astra..."}
                  className={`bg-transparent w-full resize-none outline-none max-h-32 text-sm ${astraMode === 'root' ? 'font-terminal text-green-500 placeholder-green-800' : 'text-white placeholder-gray-500'}`}
                  rows={1}
                />
            </motion.div>

            <button 
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !attachment)}
              className={`p-3 rounded-xl transition-all disabled:opacity-50 ${
                  astraMode === 'root' 
                  ? 'bg-green-600 text-black hover:bg-green-500' 
                  : 'bg-astra-blue text-black hover:bg-astra-blue/80 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              }`}
            >
                <Send size={20} />
            </button>
         </div>
      </div>

      {/* --- SCANNERS & OVERLAYS --- */}
      {scanningImage && <AstraScanner imageUrl={scanningImage} />}
      {isVoiceEnabled && !isLoading && !isLiveMode && <div className="absolute top-20 right-4 pointer-events-none opacity-50"><VoiceVisualizer /></div>}

    </div>
  );
};
