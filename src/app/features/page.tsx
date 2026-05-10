'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Features } from '@/components/Features';
import { Shield, Smartphone, Globe, Cloud, Zap, Layers, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#050505] overflow-x-hidden">
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest uppercase mb-8"
          >
            <Sparkles className="w-3 h-3" /> Advanced Capabilities 2026
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-9xl font-black font-headline mb-8 text-gradient uppercase italic leading-none tracking-tighter"
          >
            Built for <br />The Future.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium"
          >
            Explore the deep-signal protocols and cinematic interface elements that make HappyChat the industry standard.
          </motion.p>
        </div>

        <section className="relative">
          <Features />
        </section>
        
        <section className="py-32 bg-[#080808]">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                    <Layers className="w-3 h-3" /> Infrastructure
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black font-headline text-white uppercase italic tracking-tighter">Seamless Connectivity.</h2>
                </div>
                
                <div className="grid gap-8">
                  {[
                    { icon: Globe, title: "Quantum Routing", text: "Proprietary node network for near-zero latency across all continents." },
                    { icon: Cloud, title: "Distributed State", text: "Your history is mirrored across encrypted shards for instant access anywhere." },
                    { icon: Smartphone, title: "Native Engine", text: "Built with low-level assembly for buttery smooth 120Hz gesture interaction." }
                  ].map((item, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-6 group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                        <item.icon className="text-primary w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-white uppercase tracking-widest text-sm">{item.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{item.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full animate-pulse" />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="glass aspect-square rounded-[3rem] border border-white/10 flex items-center justify-center relative overflow-hidden"
                >
                  <Shield className="w-48 h-48 text-primary/20 animate-pulse" />
                  <div className="absolute bottom-10 left-10 p-6 glass rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Core Protocol Active</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}