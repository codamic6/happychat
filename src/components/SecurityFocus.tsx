
'use client';

import { Shield, Lock, EyeOff, Key, Fingerprint, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export function SecurityFocus() {
  return (
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-12">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
            >
              <Shield className="w-3 h-3" /> Security Architecture
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black font-headline tracking-tighter uppercase italic leading-[0.9] text-white"
            >
              Zero Trust. <br />
              <span className="text-primary">Total Privacy.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground font-medium max-w-lg"
            >
              We built HappyChat on the principle that your data should never be accessible to anyone but you. 
              Not even us.
            </motion.p>
          </div>

          <div className="grid gap-8">
            {[
              { icon: Lock, title: "Signal Protocol", desc: "Open-source industry standard for peer-to-peer encryption." },
              { icon: Cpu, title: "Edge Processing", desc: "All data transformations happen on your device, never in the cloud." },
              { icon: Fingerprint, title: "Biometric Gates", desc: "Optional biometric lock for every conversation thread." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black font-headline text-white uppercase tracking-tight italic">{item.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative group">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="aspect-square glass rounded-[3rem] border border-white/5 flex items-center justify-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,200,83,0.1)_0%,transparent_70%)] animate-pulse" />
            <Shield className="w-48 h-48 text-primary/20 absolute z-0" />
            
            <div className="relative z-10 grid grid-cols-2 gap-4 p-8 w-full max-w-sm">
               {[...Array(4)].map((_, i) => (
                 <motion.div 
                    key={i}
                    animate={{ 
                      opacity: [0.1, 0.4, 0.1],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      delay: i * 0.5 
                    }}
                    className="h-20 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl flex items-center justify-center"
                 >
                    <Key className="w-6 h-6 text-primary" />
                 </motion.div>
               ))}
            </div>

            {/* Floating Info */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-12 right-12 p-4 glass rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Encrypted</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
