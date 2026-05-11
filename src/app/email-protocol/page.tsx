'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Mail, Shield, Globe, Zap, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function EmailProtocolPage() {
  return (
    <main className="min-h-screen bg-[#050505] overflow-x-hidden">
      <Navbar />
      
      <div className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-6 mb-32">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest uppercase"
            >
              <Mail className="w-4 h-4" /> World's 1st Email-Based Chat
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-9xl font-black font-headline text-gradient uppercase italic leading-none tracking-tighter"
            >
              Email is <br />Identity.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-3xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-medium"
            >
              Why force phone numbers? Everyone has an email. HappyChat 2026 leverages the world's most stable digital identity to create a universal messaging layer.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link href="/get-started">
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-primary hover:glow-green-bright text-primary-foreground font-black uppercase tracking-widest text-sm shadow-2xl">
                  Register with Email
                </Button>
              </Link>
              <Button variant="ghost" size="lg" className="h-16 px-10 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-sm hover:bg-white/5">
                How it works
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="bg-[#080808] py-32 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {[
                { 
                  icon: Users, 
                  title: "Universal Access", 
                  text: "If your contact has an email, they can join the mesh. No SIM card dependency, no regional cellular barriers." 
                },
                { 
                  icon: Shield, 
                  title: "Privacy First", 
                  text: "Your email is your shard key. We never verify via intrusive SMS trackers. You own your communication link." 
                },
                { 
                  icon: Globe, 
                  title: "Global Mesh", 
                  text: "Email identities allow for decentralized routing across our global node network without needing central authority approval." 
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass p-10 h-full border-white/5 rounded-[3rem] hover:border-primary/40 transition-all group">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:glow-green transition-all">
                      <item.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black font-headline text-white uppercase italic mb-4">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-medium">{item.text}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-32 container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-12">
             <div className="text-center">
                <h2 className="text-4xl md:text-6xl font-black font-headline text-white uppercase italic tracking-tighter">The Shift.</h2>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-4">Legacy SMS Chat vs HappyChat Protocol</p>
             </div>
             
             <div className="grid gap-4">
                {[
                  { feature: "Primary Identity", legacy: "Phone Number (Tracking)", happy: "Email (Secure Shard)" },
                  { feature: "Signup Barrier", legacy: "SIM Card Required", happy: "Email Only" },
                  { feature: "Privacy Level", legacy: "Telecom Monitored", happy: "Zero-Knowledge Encrypted" },
                  { feature: "Multi-Device", legacy: "Difficult Sync", happy: "Seamless Node Sync" },
                ].map((row, i) => (
                  <div key={i} className="glass p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="text-xs font-black uppercase text-white tracking-widest">{row.feature}</span>
                    <div className="flex items-center gap-12">
                      <span className="text-[10px] font-bold text-white/40 uppercase">{row.legacy}</span>
                      <ArrowRight className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{row.happy}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
