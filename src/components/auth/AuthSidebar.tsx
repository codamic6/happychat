
'use client';

import { motion } from 'framer-motion';
import { Zap, Shield, Sparkles, MessageCircle, Lock, UserCheck } from 'lucide-react';

export function AuthSidebar() {
  return (
    <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden h-full">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 blur-[100px] rounded-full animate-pulse" />
      
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 space-y-12"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center glow-green-bright shadow-[0_0_30px_rgba(0,200,83,0.5)]">
            <Zap className="text-primary-foreground h-10 w-10 fill-current" />
          </div>
          <div>
            <h1 className="text-4xl font-black font-headline tracking-tighter text-white italic uppercase">HappyChat</h1>
            <p className="text-[10px] text-primary font-black tracking-widest uppercase">Protocol v2.0.99</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-6xl font-black font-headline leading-tight text-gradient">
            Private <br />
            Conversations. <br />
            <span className="text-primary">Reimagined.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-md font-medium">
            Fast, secure, intelligent communication for the next generation of digital creators.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          {[
            { icon: Lock, label: "E2E Secure" },
            { icon: Sparkles, label: "AI Assisted" },
            { icon: Shield, label: "Zero Trust" },
            { icon: UserCheck, label: "Verified" }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
              className="p-4 rounded-2xl glass border border-white/5 flex items-center gap-3 transition-colors"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-white tracking-tight">{item.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Floating UI Previews */}
        <div className="relative h-40">
           <motion.div
             animate={{ y: [0, -10, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-0 left-0 p-4 glass rounded-2xl border border-white/10 w-64 shadow-2xl"
           >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase">AI Thinking...</span>
              </div>
              <p className="text-xs text-muted-foreground italic">"I've summarized the main points from the morning briefing."</p>
           </motion.div>
           
           <motion.div
             animate={{ y: [0, 10, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
             className="absolute bottom-0 right-0 p-4 glass rounded-2xl border border-white/10 w-64 shadow-2xl"
           >
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white uppercase">New Message</span>
              </div>
              <p className="text-xs text-white">The security patch is deployed. All lines clear.</p>
           </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
