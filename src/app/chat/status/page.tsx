
'use client';

import React from 'react';
import { Globe, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function StatusPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-12 text-center h-full relative overflow-hidden bg-[#050505]">
      {/* Mobile Back Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => router.push('/chat')}
        className="md:hidden absolute top-6 left-6 text-muted-foreground hover:text-white"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center glow-green border border-primary/20"
      >
        <Globe className="w-16 h-16 text-primary" />
      </motion.div>

      <div className="space-y-4 max-w-sm">
        <div className="space-y-2">
          <h3 className="text-xl font-bold uppercase tracking-[0.2em] text-white font-headline">Recent Updates</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Stay connected with short updates from your network. Use the sidebar to share your own status.
          </p>
        </div>
        
        <div className="pt-8 flex items-center justify-center gap-2 text-primary/40 text-[10px] font-black uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Updates expire after 24 hours
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
