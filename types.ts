
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface GroundingMetadata {
  groundingChunks: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
  webSearchQueries?: string[];
  searchEntryPoint?: {
      renderedContent?: string;
  };
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isCode?: boolean;
  language?: string;
  image?: string; // Base64 or URL
  video?: string; // URL
  isLiveAudio?: boolean;
  groundingMetadata?: GroundingMetadata;
}

export enum AppMode {
  LANDING = 'LANDING',
  CHAT = 'CHAT'
}

export type AstraMode = 'shield' | 'skull' | 'root';

export type GenerationMode = 
  | 'CHAT' 
  | 'DEEP_THINK' 
  | 'WEB_INTEL' 
  | 'SPEED_RUN' 
  | 'IMAGE_EDIT' 
  | 'ASTRA_DETECTION' 
  | 'ASTRA_CODER';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface VoiceProfile {
  pitch: number;
  rate: number;
  voiceURI: string;
}

export type VoiceSettings = Record<AstraMode, VoiceProfile>;
