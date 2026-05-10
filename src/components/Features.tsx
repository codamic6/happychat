'use client';

import { MessageCircle, Zap, Shield, Smartphone, Globe, Layers, EyeOff, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

const bentoFeatures = [
  {
    title: 'Instant Messaging',
    desc: 'Lightning-fast delivery with real-time feedback loops.',
    icon: MessageCircle,
    className: 'md:col-span-2 md:row-span-1',
    color: 'text-primary'
  },
  {
    title: 'Zero Logs',
    desc: 'Your history is yours. We store nothing in plain text.',
    icon: EyeOff,
    className: 'md:col-span-1 md:row-span-2',
    color: 'text-emerald-400'
  },
  {
    title: 'E2E Security',
    desc: 'Military-grade encryption for every single packet.',
    icon: Shield,
    className: 'md:col-span-1 md:row-span-1',
    color: 'text-blue-400'
  },
  {
    title: 'Cross-Platform',
    desc: 'Native performance on every device you own.',
    icon: Smartphone,
    className: 'md:col-span-1 md:row-span-1',
    color: 'text-purple-400'
  },
  {
    title: 'Global Sync',
    desc: 'Distributed node network ensures zero latency worldwide.',
    icon: Globe,
    className: 'md:col-span-2 md:row-span-1',
    color: 'text-primary'
  }
];

export function Features() {
  return (
    <section id="features" className="py-16 md:py-32 container mx-auto px-6 overflow-hidden">
      <div className="max-w-4xl mb-12 md:mb-20 space-y-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
        >
          <Layers className="w-3 h-3" /> Core Capabilities
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-7xl font-black font-headline tracking-tighter uppercase italic text-white"
        >
          The <span className="text-primary">Next</span> Standard.
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium"
        >
          We've broken down the barriers of traditional messaging to build something faster, 
          stronger, and completely private.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[minmax(200px,auto)] md:auto-rows-[240px]">
        {bentoFeatures.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className={feature.className}
          >
            <Card className="h-full glass border-white/5 p-6 md:p-8 flex flex-col justify-between hover:border-primary/40 group transition-all duration-500 overflow-hidden relative rounded-[1.5rem] md:rounded-[2rem]">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/20 transition-all" />
              
              <div className="relative z-10 space-y-4 md:space-y-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:glow-green transition-all duration-500">
                  <feature.icon className={`w-5 h-5 md:w-6 md:h-6 ${feature.color}`} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-black font-headline text-white uppercase tracking-tight italic">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </div>

              <div className="relative z-10 flex justify-end pt-4">
                 <Zap className="w-4 h-4 text-white/10 group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
