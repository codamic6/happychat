'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, Code, Cpu, Sparkles, Zap, ChevronRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApiPortalPage() {
  return (
    <main className="min-h-screen bg-[#050505] overflow-x-hidden">
      <Navbar />
      
      <div className="pt-32 pb-20 container mx-auto px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center min-h-[70vh]">
          {/* Content Side */}
          <div className="space-y-12">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest uppercase mb-4"
              >
                <Terminal className="w-4 h-4" /> Developer Nexus v2.6.0
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-black font-headline text-gradient uppercase italic leading-[0.9] tracking-tighter"
              >
                Coming <br /><span className="text-primary">Soon.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-muted-foreground leading-relaxed max-w-lg font-medium"
              >
                Build the next generation of secure applications on the HappyChat Signal Protocol. Quantum-resistant, decentralized, and blazingly fast.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-2">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Request Early Access</h3>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Join 12,000+ developers on the waitlist.</p>
              </div>
              <div className="flex gap-2 relative">
                <Input placeholder="developer@happychat.io" className="bg-white/5 border-white/10 h-14 rounded-xl px-6 focus:ring-primary" />
                <Button className="glow-green font-black uppercase text-[10px] tracking-widest px-8 rounded-xl bg-primary text-primary-foreground h-14">
                  Join Beta
                </Button>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40">
              {[
                { icon: Code, label: "TypeScript SDK" },
                { icon: Cpu, label: "Edge Logic" },
                { icon: Sparkles, label: "AI Ready" },
                { icon: Zap, label: "Real-time" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <item.icon className="w-6 h-6 text-primary" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal/Code Preview Side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="glass rounded-[2rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,200,83,0.1)]">
               <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-6 gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                  <div className="w-2 h-2 rounded-full bg-primary/50" />
                  <span className="text-[10px] font-bold text-white/30 ml-4 font-code">signal-init.ts</span>
               </div>
               <div className="p-8 font-code text-sm space-y-4">
                  <p className="text-primary/60"><span className="text-white/40 italic">// Initialize the Secure Nexus</span></p>
                  <p className="text-blue-400">import <span className="text-white">{`{ SignalClient }`}</span> from <span className="text-emerald-400">'@happychat/sdk'</span>;</p>
                  <p>&nbsp;</p>
                  <p className="text-purple-400">const <span className="text-white">client</span> = <span className="text-blue-400">new</span> <span className="text-amber-400">SignalClient</span>({`{`}</p>
                  <p className="pl-4 text-white">apiKey: <span className="text-emerald-400">'hc_2026_xYz...'</span>,</p>
                  <p className="pl-4 text-white">protocol: <span className="text-emerald-400">'QUANTUM_SECURE_v2'</span>,</p>
                  <p className="pl-4 text-white">region: <span className="text-emerald-400">'global'</span></p>
                  <p className="text-white">{`}`});</p>
                  <p>&nbsp;</p>
                  <p className="text-blue-400">await <span className="text-white">client</span>.<span className="text-amber-400">connect</span>();</p>
                  <p className="text-white/40 italic">// 0x2026 Signal Active</p>
               </div>
               <div className="bg-primary/10 p-6 flex items-center justify-between border-t border-primary/20">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Protocol Verified</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-primary" />
               </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
