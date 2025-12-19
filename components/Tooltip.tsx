
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '', disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled) return <div className={className}>{children}</div>;

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`} 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${position === 'top' ? 'bottom-full mb-4' : 'top-full mt-4'} left-1/2 -translate-x-1/2 z-[100] w-max max-w-[260px] pointer-events-none`}
          >
            <div className="bg-[#050505]/95 backdrop-blur-xl border border-white/20 p-3 rounded-lg shadow-[0_0_30px_rgba(0,240,255,0.15)] relative">
               
               <div className="text-xs text-gray-300 font-sans leading-relaxed text-center">
                  {content}
               </div>

               {/* Arrow */}
               <div className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-[#050505] border-r border-b border-white/20 transform rotate-45 ${position === 'top' ? '-bottom-1.5' : '-top-1.5 border-t border-l border-r-0 border-b-0'}`}></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
