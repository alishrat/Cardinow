'use client';

import { motion } from 'motion/react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ 
        duration: 0.28, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      className="w-full flex-grow flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden"
    >
      {children}
    </motion.div>
  );
}

