'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Shield, EyeOff, Lock, Zap, ArrowRight, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505] overflow-x-hidden">
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-24">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest uppercase"
            >
              <EyeOff className="w-3 h-3" /> Data Sovereignty Protocol 2026
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-9xl font-black font-headline text-gradient uppercase italic leading-none tracking-tighter"
            >
              Privacy <br />First.
            </motion.h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              In a world of total surveillance, HappyChat provides the zero-knowledge sanctuary you deserve.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid gap-12 mb-32">
            {[
              {
                icon: Shield,
                title: "Zero-Knowledge Storage",
                content: "We do not store your keys, your passwords, or your message content. All data is sharded and encrypted locally before reaching the nexus."
              },
              {
                icon: Lock,
                title: "Metadata Scrubbing",
                content: "Our nodes automatically purge IP addresses and routing metadata every 60 seconds. We know who you are communicating with exactly zero times."
              },
              {
                icon: UserCheck,
                title: "User Control",
                content: "You own your identity. Delete your profile and all associated shards are instantly wiped from the global network via atomic self-destruct."
              }
            ].map((item, i) => (
              <motion.section 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-10 rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="text-primary w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black font-headline text-white uppercase italic tracking-tight">{item.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg font-medium">{item.content}</p>
                <Zap className="absolute bottom-6 right-8 w-4 h-4 text-white/5" />
              </motion.section>
            ))}
          </div>

          <div className="max-w-2xl mx-auto text-center glass p-8 rounded-3xl border border-dashed border-white/10 opacity-60">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Last Integrity Audit: Oct 12, 2026</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}