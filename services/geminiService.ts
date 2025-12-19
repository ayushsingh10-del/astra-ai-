
import { GoogleGenAI, Chat, GenerateContentResponse, Content, Tool, LiveServerMessage, Modality, Part } from "@google/genai";
import { 
  ASTRA_SHIELD_INSTRUCTION, 
  ASTRA_SKULL_INSTRUCTION, 
  ASTRA_ROOT_INSTRUCTION 
} from '../constants';
import { Attachment, GenerationMode, AstraMode, VoiceProfile, GroundingMetadata } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatInstance: Chat | null = null;
let currentGenMode: GenerationMode = 'CHAT'; // Track current mode to detect switches
let currentModelId = 'gemini-3-pro-preview';
let ttsAudioContext: AudioContext | null = null;
let ttsSource: AudioBufferSourceNode | null = null;
let currentTtsRequestId = 0; // Track active TTS request to handle cancellation

// --- Get System Instruction Based on Astra Mode ---
const getSystemPrompt = (astraMode: AstraMode) => {
    // Dynamic Time Sync for IST (Backend Memory Only)
    const now = new Date();
    const istTime = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" });
    const timeContext = `\n\n[SYSTEM_SYNC_DATA]:\n- CURRENT_TIME_IST: ${istTime}\n- LOCATION_LOCK: INDIA\n- PREFER_METRIC_UNITS: TRUE\n- FORMATTING: Use clean markdown. Do not be verbose about being an AI.`;

    let instruction = "";
    switch(astraMode) {
        case 'skull': instruction = ASTRA_SKULL_INSTRUCTION; break;
        case 'root': instruction = ASTRA_ROOT_INSTRUCTION; break;
        case 'shield': default: instruction = ASTRA_SHIELD_INSTRUCTION; break;
    }
    return instruction + timeContext;
};

// --- 1. Chat & Text Logic ---

const getModelConfig = (genMode: GenerationMode, astraMode: AstraMode) => {
  const systemInstruction = getSystemPrompt(astraMode);

  switch (genMode) {
    case 'DEEP_THINK':
      return {
        model: 'gemini-3-pro-preview', // High Intelligence Model
        config: {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 32768 }
        }
      };
    case 'WEB_INTEL':
      return {
        model: 'gemini-2.5-flash', // Fast + Search
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} } as Tool] // Explicitly attach Google Search Tool
        }
      };
    case 'SPEED_RUN':
      return {
        model: 'gemini-2.5-flash', // Explicitly FAST model
        config: {
          systemInstruction,
          temperature: 0.7
        }
      };
    case 'ASTRA_CODER':
        return {
             model: 'gemini-3-pro-preview', // Coding requires intelligence
             config: { 
                 systemInstruction: "You are ASTRA CODER (Canvas Mode). You are an expert Full-Stack Developer and Software Architect. Your goal is to provide complete, production-ready, clean, and bug-free code. When writing code, explain your logic briefly and then provide the full implementation in a single, well-structured code block. Prefer modern frameworks (React, Next.js, Tailwind) and robust practices.",
                 temperature: 0.2 
             }
        };
    case 'IMAGE_EDIT': 
        return {
            model: 'gemini-2.5-flash-image',
            config: { systemInstruction }
        };
    case 'ASTRA_DETECTION':
         return {
            model: 'gemini-3-pro-preview',
            config: { systemInstruction }
         };
    case 'CHAT':
    default:
      return {
        model: 'gemini-2.5-flash', // DEFAULT: Optimized for speed/efficiency (2.5 Flash)
        config: {
          systemInstruction,
          temperature: astraMode === 'root' ? 0.2 : 0.9, // More deterministic for Root
        }
      };
  }
};

export const initializeChat = (
  genMode: GenerationMode = 'CHAT', 
  astraMode: AstraMode = 'shield',
  history?: Content[]
) => {
  const { model, config } = getModelConfig(genMode, astraMode);
  currentModelId = model;
  currentGenMode = genMode;
  
  chatInstance = ai.chats.create({
    model: model,
    config: config,
    history: history
  });
};

export const sendMessageToGemini = async (
  userMessage: string,
  attachment: Attachment | null,
  genMode: GenerationMode,
  astraMode: AstraMode,
  onStream: (text: string) => void,
  onMetadata: (metadata: GroundingMetadata) => void,
  history: Content[] = []
): Promise<string> => {
  
  // Re-initialize if chat doesn't exist OR if we are switching modes (e.g. enabling Tools)
  if (!chatInstance || currentGenMode !== genMode) {
      console.log(`[ASTRA CORE] Switching Protocol: ${currentGenMode} -> ${genMode}`);
      initializeChat(genMode, astraMode, history);
  }

  let fullResponse = "";
  
  try {
    let result;
    
    if (attachment) {
       const { model, config } = getModelConfig(genMode, astraMode);
       currentModelId = model; // Capture model used for attachment
       const response = await ai.models.generateContentStream({
        model: model,
        contents: {
          parts: [
            { inlineData: { data: attachment.base64, mimeType: attachment.mimeType } },
            { text: userMessage }
          ]
        },
        config: config
       });
       result = response;
    } else {
       result = await chatInstance!.sendMessageStream({ message: userMessage });
    }

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullResponse += text;
        onStream(fullResponse);
      }
      // Capture Grounding Metadata (Sources)
      if (c.candidates?.[0]?.groundingMetadata) {
          onMetadata(c.candidates[0].groundingMetadata as GroundingMetadata);
      }
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    const errorMsg = "RTMS CONNECTION INTERRUPTED. NETWORK ANOMALY DETECTED. 🚫";
    onStream(errorMsg);
    return errorMsg;
  }

  return fullResponse;
};

// --- 2. Enhanced TTS (Gemini Model) ---
export const speakText = async (
    text: string, 
    astraMode: AstraMode = 'shield', 
    customProfile?: VoiceProfile,
    stop: boolean = false,
    onComplete?: () => void
) => {
    // Generate a unique ID for this request
    const requestId = ++currentTtsRequestId;

    // Stop any existing playback immediately
    if (ttsSource) {
        try { ttsSource.stop(); } catch (e) {}
        ttsSource = null;
    }

    // If stop requested or empty text, finish here
    if (stop || !text) {
        if (onComplete) onComplete();
        return;
    }

    // Filter out metadata artifacts just in case
    const cleanText = text.replace(/\[.*?\]/g, '').trim();
    if (!cleanText) {
        if (onComplete) onComplete();
        return;
    }

    // Initialize Audio Context if needed
    if (!ttsAudioContext) {
        ttsAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    // Resume context if suspended (browser autoplay policy)
    if (ttsAudioContext.state === 'suspended') {
        await ttsAudioContext.resume();
    }

    // Determine Voice
    let voiceName = 'Kore';
    if (astraMode === 'skull') voiceName = 'Puck';
    if (astraMode === 'root') voiceName = 'Fenrir';

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: cleanText }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName }
                    }
                }
            },
        });

        // CHECK CANCELLATION: If a new request came in while waiting, abort.
        if (requestId !== currentTtsRequestId) return;

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (base64Audio) {
            const audioBuffer = await decodeAudioData(base64Audio, ttsAudioContext);
            
            // CHECK CANCELLATION: Decoding is async, check again
            if (requestId !== currentTtsRequestId) return;

            const source = ttsAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ttsAudioContext.destination);
            
            source.onended = () => {
                // Only trigger complete if this is still the active source
                if (requestId === currentTtsRequestId) {
                    ttsSource = null;
                    if (onComplete) onComplete();
                }
            };

            source.start();
            ttsSource = source;
        } else {
             if (onComplete) onComplete();
        }
    } catch (e) {
        console.error("TTS Generation Failed", e);
        if (onComplete) onComplete();
    }
};

// Helper for decoding Gemini Audio (which doesn't have headers)
const decodeAudioData = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const numChannels = 1;
    const sampleRate = 24000;
    
    try {
        // Copy buffer because decodeAudioData detaches it
        const bufferCopy = bytes.buffer.slice(0);
        return await ctx.decodeAudioData(bufferCopy);
    } catch (e) {
        // Fallback to Raw PCM decoding
        const dataInt16 = new Int16Array(bytes.buffer);
        const frameCount = dataInt16.length;
        const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
             channelData[i] = dataInt16[i] / 32768.0;
        }
        return audioBuffer;
    }
};


// --- 3. Image Editing ---
export const generateEditedImage = async (prompt: string, base64Image?: string, mimeType?: string): Promise<string | null> => {
  try {
    const parts: Part[] = [];
    
    // Add image first if available
    if (base64Image && mimeType) {
      parts.push({
        inlineData: { data: base64Image, mimeType: mimeType }
      });
    }
    
    // Add text prompt
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
          imageConfig: {
              aspectRatio: '1:1'
          }
      }
    });

    for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    console.warn("No image returned. Response might contain text rejection.");
    return null;
  } catch (e) {
    console.error("Image Gen Error", e);
    return null;
  }
};

// --- 4. Astra Deepfake Detection ---
export const runAstraDetection = async (attachment: Attachment, onStream: (text: string) => void): Promise<string> => {
  // Enhanced Forensic Prompt for High-Quality AI Detection
  const prompt = `
  **IDENTITY:** You are ASTRA FORENSIC CORE, a specialized Digital Forensics AI.
  **MISSION:** Perform a hostile, microscopic audit of the attached image to detect Generative AI artifacts (Flux, Midjourney, DALL-E, Gemini) or Deepfakes.

  **🕵️‍♂️ DEEP-SCAN PROTOCOLS (LOOK FOR THESE):**

  1.  **SKIN & TEXTURE PHYSICS (Subsurface Scattering):**
      *   Real skin is translucent and imperfect. Look for "plasticity" or overly smooth "porcelain" textures.
      *   Check for repeating noise patterns in skin pores.
  
  2.  **OCULAR ANOMALIES (The "Soul" Check):**
      *   **Pupils:** Are they perfectly round? (Real pupils often aren't). Is the dilation consistent?
      *   **Reflections (Catchlights):** Do the eyes reflect the *same* light source? AI often places different windows/lights in each eye.
  
  3.  **ANATOMICAL LOGIC:**
      *   Count fingers and toes. Check for "melting" nails.
      *   Ear structure: The helix and anti-helix are complex. AI often blurs them into a generic shape.
      *   Hair: Does hair dissolve into the skin or clothing? Look for "floating strands" that don't connect to the root.
  
  4.  **LIGHTING & SHADOW PHYSICS:**
      *   Does the shadow direction match the light source?
      *   "Rim lighting" inconsistencies: AI loves dramatic rim lighting that doesn't align with the environment.
  
  5.  **BACKGROUND COHERENCE (The Bokeh Test):**
      *   Look at out-of-focus background elements. AI often creates "hallucinated objects" that look like lamps/chairs but are structurally nonsense.
      *   Depth of field: Is the blur gradual or a flat "cut-out" effect?

  **STRICT OUTPUT FORMAT:**
  You must output the report in this exact structure for the UI to parse:

  [ANOMALIES_DETECTED]
  - [CRITICAL] (e.g. "Left iris has double reflection, physically impossible")
  - [SUSPICIOUS] (e.g. "Skin texture lacks pore definition on cheek")
  - [MINOR] (e.g. "Background bokeh shape is irregular")
  - (If 100% Real: "No digital anomalies detected. ISO noise pattern is consistent with CMOS sensors.")

  [FORENSIC_REPORT]
  (Write a detailed, technical paragraph. Use terms like 'Diffusion Dithering', 'Chromatic Aberration', 'Compression Artifacts'. Explain WHY it looks real or fake. Be extremely skeptical of high-quality images.)

  [CONCLUSION]
  VERDICT: (ORIGINAL / AI_GENERATED / AI_MODIFIED)
  CONFIDENCE_SCORE: (0-100)%
  (Final summary statement.)
  `;

  let fullResponse = "";
  try {
    const response = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview', // Use PRO model for high-IQ vision tasks
        contents: {
            parts: [
                { inlineData: { data: attachment.base64, mimeType: attachment.mimeType } },
                { text: prompt }
            ]
        },
        config: {
            // Lower temperature for analytic precision
            temperature: 0.1,
            systemInstruction: "You are a skeptical Digital Forensic Analyst. Assume every image is a potential deepfake until proven otherwise."
        }
    });
    for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
            fullResponse += text;
            onStream(fullResponse);
        }
    }
    return fullResponse;
  } catch (e) {
      onStream("ASTRA FORENSIC SCAN FAILED: NETWORK ERROR.");
      return "Error";
  }
};

// --- 5. GEMINI LIVE (Real-time Bidirectional Audio) ---

export class AstraLiveSession {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private nextStartTime = 0;
  private astraMode: AstraMode;

  constructor(mode: AstraMode) {
    this.astraMode = mode;
  }

  async start(onClose: () => void) {
    // Initialize Audio Contexts
    // Input needs to be 16kHz for Gemini
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    // Output from Gemini is 24kHz
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    // Get System Instruction
    const systemInstruction = getSystemPrompt(this.astraMode);
    
    // Choose voice based on mode for Live Session as well
    let voiceName = 'Kore';
    if (this.astraMode === 'skull') voiceName = 'Puck';
    if (this.astraMode === 'root') voiceName = 'Fenrir';

    try {
        // Connect to Gemini Live
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: systemInstruction,
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName } } 
                }
            },
            callbacks: {
                onopen: async () => {
                    console.log("ASTRA LIVE: CONNECTED");
                    this.startRecording(sessionPromise);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        await this.playAudio(audioData);
                    }
                    const turnComplete = message.serverContent?.turnComplete;
                },
                onclose: () => {
                    console.log("ASTRA LIVE: CLOSED");
                    this.stop();
                    onClose();
                },
                onerror: (err) => {
                    console.error("ASTRA LIVE ERROR", err);
                    this.stop();
                    onClose();
                }
            }
        });
    } catch (err) {
        console.error("Failed to connect to Live API", err);
        onClose();
    }
  }

  private async startRecording(sessionPromise: Promise<any>) {
      if (!this.inputAudioContext) return;

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      
      this.analyser = this.inputAudioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.source.connect(this.analyser);

      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = this.convertFloat32ToInt16(inputData);
          const base64 = this.arrayBufferToBase64(pcmData.buffer);
          
          sessionPromise.then(session => {
              session.sendRealtimeInput({
                  media: {
                      mimeType: 'audio/pcm;rate=16000',
                      data: base64
                  }
              });
          });
      };

      this.source.connect(this.processor);
      this.processor.connect(this.inputAudioContext.destination);
  }

  private async playAudio(base64: string) {
      if (!this.outputAudioContext) return;

      const arrayBuffer = this.base64ToArrayBuffer(base64);
      const float32Data = this.convertInt16ToFloat32(new Int16Array(arrayBuffer));
      const audioBuffer = this.outputAudioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);

      // Queue playback
      const currentTime = this.outputAudioContext.currentTime;
      if (this.nextStartTime < currentTime) {
          this.nextStartTime = currentTime;
      }
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  stop() {
      this.processor?.disconnect();
      this.source?.disconnect();
      this.analyser?.disconnect();
      this.mediaStream?.getTracks().forEach(t => t.stop());
      this.inputAudioContext?.close();
      this.outputAudioContext?.close();
      
      this.processor = null;
      this.source = null;
      this.analyser = null;
      this.mediaStream = null;
      this.inputAudioContext = null;
      this.outputAudioContext = null;
  }

  // Utils
  private convertFloat32ToInt16(float32: Float32Array) {
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-1, Math.min(1, float32[i])) * 0x7FFF;
      }
      return int16;
  }

  private convertInt16ToFloat32(int16: Int16Array) {
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 0x7FFF;
      }
      return float32;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
  }
}
