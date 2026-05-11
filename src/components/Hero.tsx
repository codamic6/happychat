'use client';

import { Button } from '@/components/ui/button';
import { Zap, Mail, ArrowRight, Sparkles, Lock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-12 overflow-hidden">
      {/* Animated Background Mesh - Contained */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] md:w-[40%] h-[40%] bg-primary/10 blur-[100px] md:blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] md:w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] md:blur-[150px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto space-y-8 md:space-y-10"
        >
          {/* Version Pill */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl group cursor-default">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/60 group-hover:text-primary transition-colors">
              World's 1st Email-Based Messenger
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-9xl font-black font-headline tracking-tighter leading-[1] md:leading-[0.9] text-white italic uppercase break-words"
          >
            Universal <br />
            <span className="text-gradient">Messaging.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed px-4"
          >
            The world's first chat platform that uses your email identity as a universal secure shard. 
            No phone number forced, no barriers—if they have an email, you have a connection.
          </motion.p>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center px-4">
            <Link href="/get-started" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 rounded-2xl bg-primary hover:glow-green-bright text-primary-foreground font-black uppercase tracking-widest text-sm md:text-base group transition-all">
                Get Started 
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/email-protocol" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-sm md:text-base hover:bg-white/5 transition-all">
                The Protocol
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            variants={itemVariants}
            className="pt-8 md:pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700"
          >
            {[
              { icon: Mail, label: "Email Native" },
              { icon: Globe, label: "Global Identity" },
              { icon: Lock, label: "Zero-Knowledge" },
              { icon: Sparkles, label: "Quantum Ready" }
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <badge.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{badge.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Sci-Fi Grid Elements */}
      <div className="absolute left-0 bottom-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-0 z-[-1] opacity-[0.03] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:40px_40px] md:[background-size:60px_60px] pointer-events-none" />
    </div>
  );
}
