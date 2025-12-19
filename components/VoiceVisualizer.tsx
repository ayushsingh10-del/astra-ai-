
import React from 'react';
import { motion } from 'framer-motion';

interface VoiceVisualizerProps {
  data?: Uint8Array;
  color?: string;
  count?: number;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = React.memo(({ 
  data, 
  color = "astra-saffron", 
  count = 12 
}) => {
  // If no real-time data provided, fallback to standard animation
  if (!data || data.length === 0) {
    return (
      <div className="flex items-end justify-center gap-1 h-6 w-auto">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`w-1 bg-${color}`}
            animate={{
              height: ["20%", "100%", "20%"],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "mirror",
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  }

  // Real-time visualization
  // We sub-sample the frequency data to fit the bar count
  const step = Math.floor(data.length / count);
  const bars = Array.from({ length: count }, (_, i) => {
    // Basic average of a chunk of frequencies for smoother visual
    let sum = 0;
    for (let j = 0; j < step; j++) {
      sum += data[i * step + j];
    }
    const val = sum / step;
    // Scale 0-255 to 10-100% height
    return Math.max(15, (val / 255) * 100);
  });

  return (
    <div className="flex items-center justify-center gap-1.5 h-12 px-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className={`w-1.5 rounded-full bg-${color}`}
          initial={{ height: "15%" }}
          animate={{ height: `${height}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            boxShadow: `0 0 10px ${color === 'astra-saffron' ? '#FF9933' : '#00F0FF'}33`
          }}
        />
      ))}
    </div>
  );
});
