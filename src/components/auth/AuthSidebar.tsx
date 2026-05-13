'use client';

import { motion } from 'framer-motion';
import { Zap, Shield, Sparkles, MessageCircle, Lock, UserCheck, Globe, Cpu } from 'lucide-react';

export function AuthSidebar() {
  return (
    <div className="hidden lg:flex flex-col justify-center p-16 relative overflow-hidden h-full border-r border-white/5 bg-[#080808]">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full animate-pulse delay-700" />
      
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 space-y-16"
      >
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-[2rem] bg-primary flex items-center justify-center glow-green-bright shadow-[0_0_50px_rgba(0,200,83,0.4)] transition-transform hover:rotate-12 duration-500">
            <Zap className="text-primary-foreground h-12 w-12 fill-current" />
          </div>
          <div>
            <h1 className="text-5xl font-black font-headline tracking-tighter text-white uppercase leading-none">HappyChat</h1>
            <p className="text-[10px] text-primary font-black tracking-[0.4em] uppercase mt-2">Protocol Nexus v2.6.0</p>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-7xl font-black font-headline leading-[0.9] text-gradient uppercase tracking-tighter">
            Private <br />
            Nexus. <br />
            <span className="text-primary">Evolved.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-lg font-medium leading-relaxed">
            The standard for secure, zero-knowledge communication in 2026. Join the global mesh network.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 max-w-xl">
          {[
            { icon: Lock, label: "Post-Quantum Secure", desc: "Future-proof keys" },
            { icon: Sparkles, label: "Neural Engine", desc: "On-edge logic" },
            { icon: Shield, label: "Zero Knowledge", desc: "We see nothing" },
            { icon: Globe, label: "Global Mesh", desc: "No central point" }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
              className="p-6 rounded-[2rem] glass border border-white/5 space-y-3 transition-all group"
            >
              <item.icon className="w-6 h-6 text-primary group-hover:glow-green transition-all" />
              <div>
                <span className="block text-sm font-black text-white uppercase tracking-tight">{item.label}</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Protocol Status */}
        <div className="pt-8">
           <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Mainnet Active</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">0x2026_SECURE</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
