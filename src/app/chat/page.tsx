
'use client';

import { MessageSquare, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatEmptyPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-30 p-12 text-center h-full">
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center glow-green border border-primary/20"
      >
        <MessageSquare className="w-12 h-12 text-primary" />
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-sm font-black uppercase tracking-[0.4em] italic text-white font-headline">Select a Conversation</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Secure Signal Protocol Phase II Active</p>
      </div>
      <div className="pt-8 flex items-center gap-2 text-primary/40 text-[10px] font-black uppercase tracking-widest">
        <Sparkles className="w-3 h-3" />
        AI Neural Copilot Ready
      </div>
    </div>
  );
}
