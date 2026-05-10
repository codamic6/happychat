'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SecurityFocus } from '@/components/SecurityFocus';
import { Lock, ShieldCheck, Fingerprint, EyeOff, Shield, Key, Cpu, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#050505] overflow-x-hidden">
      <Navbar />
      <div className="pt-32">
        <div className="container mx-auto px-6 mb-32">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest uppercase mb-4"
            >
              <ShieldCheck className="w-4 h-4" /> Zero-Trust Architecture v3.0
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-9xl font-black font-headline text-gradient uppercase italic leading-none tracking-tighter"
            >
              Your Data. <br />Your Key.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-3xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-medium"
            >
              Military-grade cryptographic protocols ensure that not even HappyChat nodes can decipher your content.
            </motion.p>
          </div>
        </div>

        <SecurityFocus />

        <section className="py-32 relative overflow-hidden bg-[#080808]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-6xl font-black font-headline text-white uppercase italic tracking-tighter">Security Layers.</h2>
               <p className="text-muted-foreground mt-4 uppercase tracking-[0.2em] font-bold text-[10px]">Defense in Depth Strategy</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Lock, title: "Signal 2.0", desc: "Advanced peer-to-peer encryption for the 2026 landscape." },
                { icon: Fingerprint, title: "Biometric Gates", desc: "Thread-level locks triggered by native biometric sensors." },
                { icon: EyeOff, title: "Incognito Input", desc: "Zero-telemetry keyboard interaction. We never learn your habits." },
                { icon: Cpu, title: "Hardware Isolation", desc: "Encryption keys are stored exclusively in your device's Secure Enclave." }
              ].map((layer, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass p-8 border-white/5 text-center h-full hover:border-primary/30 transition-all rounded-[2.5rem] flex flex-col justify-between group">
                    <div>
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:glow-green transition-all">
                        <layer.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="font-black font-headline text-xl text-white uppercase italic mb-4">{layer.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/5 opacity-20 group-hover:opacity-100 transition-opacity">
                      <Zap className="w-4 h-4 mx-auto text-primary" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}