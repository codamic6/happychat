'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FileText, ShieldCheck, Scale, Zap, Info, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsPage() {
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
              <FileText className="w-3 h-3" /> Service Level Agreement 2026
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-9xl font-black font-headline text-gradient uppercase italic leading-none tracking-tighter"
            >
              Terms of <br />Signal.
            </motion.h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              By accessing the HappyChat nexus, you agree to these fundamental protocols of engagement.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6 mb-32">
            {[
              {
                title: "1. Acceptance of Nexus",
                desc: "Your entry into the HappyChat environment constitutes absolute acceptance of our zero-knowledge policy. If you require server-side storage, this platform is not for you."
              },
              {
                title: "2. Sovereignty License",
                desc: "We grant you a non-transferable right to utilize our sharding engine. All generated cryptographic material belongs to you. We hold no claims over your keys or content."
              },
              {
                title: "3. Ethical Protocol",
                desc: "The platform may not be used for malicious interference or network degradation. We reserve the right to revoke interface access if local heuristics detect offensive automated scraping."
              },
              {
                title: "4. No Liability for Key Loss",
                desc: "HappyChat is not liable for data loss due to lost recovery keys. There is no 'forgot password' mechanism that can bypass the primary encryption layer."
              }
            ].map((section, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass p-8 md:p-12 rounded-[3rem] border border-white/5 space-y-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black font-headline text-white uppercase italic tracking-tight">{section.title}</h2>
                  <Scale className="w-5 h-5 text-primary/20" />
                </div>
                <p className="text-muted-foreground leading-relaxed text-base font-medium">{section.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 opacity-40">
             <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Verified Protocol v2.6</span>
             </div>
             <div className="flex items-center gap-2">
               <Info className="w-4 h-4 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Last Updated: Jan 01, 2026</span>
             </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}