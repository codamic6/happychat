'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Activity, Globe, Zap, Shield, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function StatusPage() {
  const nodes = [
    { city: "London", region: "EU-1", status: "Online", latency: "4ms" },
    { city: "New York", region: "US-1", status: "Online", latency: "2ms" },
    { city: "Tokyo", region: "JP-1", status: "Online", latency: "9ms" },
    { city: "Singapore", region: "SG-1", status: "Online", latency: "7ms" },
    { city: "São Paulo", region: "BR-1", status: "Online", latency: "12ms" },
    { city: "Sydney", region: "AU-1", status: "Online", latency: "15ms" },
  ];

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
              <Activity className="w-3 h-3" /> System Health Monitor
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-9xl font-black font-headline text-gradient uppercase italic leading-none tracking-tighter"
            >
              Systems <br />Online.
            </motion.h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Real-time view of our global network and system health.
            </p>
          </div>

          {/* Current Status Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { label: "App Speed", val: "Fast", icon: Zap },
              { label: "Security System", val: "Active", icon: Shield },
              { label: "Average Response", val: "8.4ms", icon: Clock },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass p-8 border-white/5 flex items-center justify-between rounded-[2rem] group hover:border-primary/30 transition-all">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-white italic">{stat.val}</p>
                  </div>
                  <stat.icon className="w-10 h-10 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Node Grid */}
          <div className="glass rounded-[3rem] border border-white/5 overflow-hidden mb-24">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Globe className="text-primary w-5 h-5" />
                <h2 className="text-xl font-black font-headline text-white uppercase italic tracking-tight">Global System Nodes</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="text-[10px] font-black text-primary uppercase">Active Sync</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-white/5">
              {nodes.map((node, i) => (
                <div key={i} className="p-8 hover:bg-white/[0.01] transition-colors group">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">{node.city}</h3>
                    <CheckCircle2 className="text-primary w-5 h-5" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">ID</span>
                      <span className="text-white font-code">{node.region}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">Speed</span>
                      <span className="text-primary">{node.latency}</span>
                    </div>
                    <div className="pt-4">
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-full shadow-[0_0_8px_hsl(var(--primary))]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Log */}
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-sm font-black text-center text-muted-foreground uppercase tracking-[0.4em]">System Logs</h3>
            <div className="glass p-8 rounded-[2rem] border border-white/5 text-center">
              <p className="text-sm font-medium text-white/40 italic">No issues recorded in the last 90 days.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}