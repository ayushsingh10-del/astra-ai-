
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
}

export const Typewriter: React.FC<TypewriterProps> = React.memo(({ text, speed = 5, className }) => {
  const [displayedText, setDisplayedText] = useState('');
  const textRef = useRef(text);
  const displayedLengthRef = useRef(0);

  // Reset if the text content seems to be from a completely new message source
  useEffect(() => {
    if (text.length < displayedLengthRef.current) {
      setDisplayedText('');
      displayedLengthRef.current = 0;
    }
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    let animationId: number;
    let lastTime = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - lastTime;
      
      if (elapsed >= speed) {
        setDisplayedText((prev) => {
          const currentText = textRef.current;
          if (prev.length < currentText.length) {
            const diff = currentText.length - prev.length;
            const chunk = Math.max(1, Math.floor(diff / 5)); 
            const newText = currentText.substring(0, prev.length + chunk);
            displayedLengthRef.current = newText.length;
            return newText;
          }
          displayedLengthRef.current = prev.length;
          return prev;
        });
        lastTime = currentTime;
      }
      
      if (displayedLengthRef.current < textRef.current.length) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [speed]);

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
});
