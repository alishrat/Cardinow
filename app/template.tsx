'use client';

import { motion } from 'motion/react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.22, 
        ease: 'easeInOut' 
      }}
      className="w-full flex-grow flex flex-col bg-slate-950 text-slate-100"
    >
      {children}
    </motion.div>
  );
}

