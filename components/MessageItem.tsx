import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { Copy, Check, Volume2, Download, StopCircle as StopIcon } from 'lucide-react';
import { Typewriter } from './Typewriter';

interface MessageItemProps {
  msg: Message;
  isLatest: boolean;
  isLoading: boolean;
  astraMode: string;
  copiedId: string | null;
  speakingMessageId: string | null;
  onCopy: (text: string, id: string) => void;
  onSpeakToggle: (text: string, id: string) => void;
  ForensicResultDisplay?: React.ComponentType<{ text: string }>;
}

export const MessageItem: React.FC<MessageItemProps> = React.memo(({ 
  msg, 
  isLatest, 
  isLoading, 
  astraMode,
  copiedId,
  speakingMessageId,
  onCopy,
  onSpeakToggle,
  ForensicResultDisplay
}) => {
  return (
    <motion.div 
      key={msg.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${msg.role === Role.USER ? 'items-end' : 'items-start'} gap-1`}
    >
      <div className={`max-w-[85%] md:max-w-[70%] group relative ${
          msg.role === Role.USER 
           ? 'bg-[#2f2f2f] text-white rounded-[24px] px-5 py-3 rounded-br-none' 
           : 'bg-transparent text-white px-0 py-0'
      }`}>
          
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

          <div className={`prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 ${astraMode === 'root' ? 'font-terminal text-lg text-green-500' : 'font-light text-base'}`}>
             {ForensicResultDisplay && msg.text.includes('[ANOMALIES_DETECTED]') ? (
                 <ForensicResultDisplay text={msg.text} />
             ) : (
                 isLatest && msg.role === Role.MODEL && isLoading ? (
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

      {msg.role === Role.MODEL && (
          <div className="flex items-center gap-4 px-1 mt-1 opacity-60 text-gray-400">
              <button onClick={() => onCopy(msg.text, msg.id)} className="hover:text-white transition-colors">
                  {copiedId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
              <button 
                  onClick={() => onSpeakToggle(msg.text, msg.id)} 
                  className={`transition-colors ${speakingMessageId === msg.id ? 'text-astra-saffron animate-pulse' : 'hover:text-white'}`}
              >
                  {speakingMessageId === msg.id ? <StopIcon size={14} /> : <Volume2 size={14} />}
              </button>
              <span className="text-[10px] font-sans pt-0.5">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
      )}
      
      {msg.role === Role.USER && (
          <div className="text-[10px] text-gray-500 mr-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      )}

    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.text === nextProps.msg.text &&
    prevProps.isLatest === nextProps.isLatest &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.copiedId === nextProps.copiedId &&
    prevProps.speakingMessageId === nextProps.speakingMessageId
  );
});
