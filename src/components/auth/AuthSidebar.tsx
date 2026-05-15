'use client';

import { motion } from 'framer-motion';
import { Shield, Sparkles, Lock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative group", className)}>
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
      <Image 
        src="/Logo.png" 
        alt="HappyChat Logo" 
        width={100} 
        height={100} 
        className="relative z-10 w-full h-full object-contain"
        priority
      />
    </div>
  );
}

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
          <BrandLogo className="w-20 h-20 shadow-[0_0_50px_rgba(0,200,83,0.4)] transition-transform hover:rotate-6 duration-500" />
          <div>
            <h1 className="text-5xl font-black font-headline tracking-tighter text-white uppercase leading-none">HappyChat</h1>
            <p className="text-[10px] text-primary font-black tracking-[0.4em] uppercase mt-2">App System v1.0</p>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-7xl font-black font-headline leading-[0.9] text-gradient uppercase tracking-tighter">
            Private <br />
            App. <br />
            <span className="text-primary">Evolved.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-lg font-medium leading-relaxed">
            The standard for secure, private communication. Join our global network today.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 max-w-xl">
          {[
            { icon: Lock, label: "Advanced Security", desc: "Always protected" },
            { icon: Sparkles, label: "Smart System", desc: "Easy to use" },
            { icon: Shield, label: "Total Privacy", desc: "We see nothing" },
            { icon: Globe, label: "Global Network", desc: "Fast everywhere" }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
              className="p-6 rounded-[2.5rem] glass border border-white/5 space-y-3 transition-all group"
            >
              <item.icon className="w-6 h-6 text-primary group-hover:glow-green transition-all" />
              <div>
                <span className="block text-sm font-black text-white uppercase tracking-tight">{item.label}</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating System Status */}
        <div className="pt-8">
           <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">System Active</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">SECURE_APP</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
