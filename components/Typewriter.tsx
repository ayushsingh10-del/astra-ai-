
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 5, className }) => {
  const [displayedText, setDisplayedText] = useState('');

  // Reset if the text content seems to be from a completely new message source
  // We use a simple heuristic: if the new text is shorter than what we displayed, it's likely a reset/new message.
  useEffect(() => {
    if (text.length < displayedText.length) {
      setDisplayedText('');
    }
  }, [text, displayedText.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length < text.length) {
          // Calculate how many characters to add to catch up smoothly
          // If the stream is very fast, we add more characters per tick to prevent lagging behind
          const diff = text.length - prev.length;
          const chunk = Math.max(1, Math.floor(diff / 5)); 
          return text.substring(0, prev.length + chunk);
        }
        return prev;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className={className}>
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
        {displayedText}
      </ReactMarkdown>
      {displayedText.length < text.length && (
          <span className="inline-block w-2 h-4 ml-1 bg-astra-saffron animate-pulse align-middle"></span>
      )}
    </div>
  );
};
