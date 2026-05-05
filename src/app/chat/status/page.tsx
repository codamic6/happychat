
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, ShieldCheck, Globe, Zap, Cpu, 
  Terminal, BarChart3, Clock, AlertCircle, 
  CheckCircle2, ArrowUpRight, Search, Filter,
  ChevronDown, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

// Simulated latency data
const generateData = () => Array.from({ length: 20 }, (_, i) => ({
  time: i,
  latency: Math.floor(Math.random() * 40) + 10,
}));

type Service = {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  uptime: string;
  latency: string;
  icon: any;
  description: string;
};

const SERVICES: Service[] = [
  { id: 'protocol', name: 'Signal Protocol', status: 'online', uptime: '99.99%', latency: '12ms', icon: ShieldCheck, description: 'End-to-end encryption layer' },
  { id: 'ai', name: 'AI Neural Link', status: 'online', uptime: '99.95%', latency: '45ms', icon: Cpu, description: 'Genkit cognitive processing' },
  { id: 'storage', name: 'MEGA Cloud', status: 'online', uptime: '99.90%', latency: '120ms', icon: Globe, description: 'Encrypted object storage' },
  { id: 'routing', name: 'Edge Routing', status: 'online', uptime: '100%', latency: '8ms', icon: Zap, description: 'Global low-latency delivery' },
];

type Incident = {
  id: string;
  type: 'security' | 'system' | 'ai';
  message: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
};

const INITIAL_INCIDENTS: Incident[] = [
  { id: '1', type: 'security', message: 'RSA-4096 Key Rotation successful on Node-04', time: '2m ago', severity: 'low' },
  { id: '2', type: 'system', message: 'Automatic scaling: 12 new Edge nodes deployed', time: '5m ago', severity: 'low' },
  { id: '3', type: 'ai', message: 'Context window expanded for premium clusters', time: '12m ago', severity: 'low' },
];

export default function StatusDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [latencyData, setLatencyData] = useState(generateData());

  // Simulation: Update latency and incidents periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyData(generateData());
      
      if (Math.random() > 0.7) {
        const newIncident: Incident = {
          id: Math.random().toString(),
          type: Math.random() > 0.5 ? 'system' : 'security',
          message: `Scheduled performance audit completed on Cluster-${Math.floor(Math.random() * 10)}`,
          time: 'now',
          severity: 'low'
        };
        setIncidents(prev => [newIncident, ...prev].slice(0, 10));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const systemMetrics = [
    { label: 'Global Uptime', value: '99.998%', icon: Activity, trend: '+0.001%' },
    { label: 'Active Nodes', value: '4,208', icon: Globe, trend: '+12 today' },
    { label: 'System Load', value: '22%', icon: BarChart3, trend: 'Optimal' },
  ];

  return (
    <div className="flex-1 bg-[#050505] overflow-y-auto custom-scrollbar overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12 pb-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live System Intelligence
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter text-gradient uppercase">Network Status</h1>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <Clock className="w-3 h-3" /> Last check: Just now
          </div>
        </div>

        {/* Global Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {systemMetrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass p-6 border-white/5 hover:border-primary/20 transition-colors group relative overflow-hidden rounded-[2rem]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <metric.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{metric.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-headline text-white tracking-tighter">{metric.value}</span>
                  <span className="text-primary text-[10px] font-bold">{metric.trend}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Service Grid - Desktop (Interactive) / Mobile (Accordion) */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" /> Service Integrity
          </h3>
          
          {/* Desktop Grid */}
          <div className="hidden lg:grid grid-cols-4 gap-6">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.id}
                whileHover={{ y: -5 }}
                className="group relative h-[320px]"
              >
                <Card className="glass h-full p-6 border-white/5 flex flex-col justify-between rounded-[2rem] transition-all duration-500 hover:border-primary/40 group-hover:shadow-[0_0_40px_rgba(0,200,83,0.1)]">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        <service.icon className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="border-primary/20 text-primary text-[8px] uppercase font-black tracking-widest bg-primary/5">
                        {service.status}
                      </Badge>
                    </div>
                    <h4 className="text-lg font-bold font-headline mb-1">{service.name}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-6">{service.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">Latency</span>
                      <span className="text-primary">{service.latency}</span>
                    </div>
                    <div className="h-16 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={latencyData}>
                          <Area type="monotone" dataKey="latency" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Mobile Accordion */}
          <div className="lg:hidden space-y-4">
            <Accordion type="single" collapsible className="space-y-4">
              {SERVICES.map((service) => (
                <AccordionItem key={service.id} value={service.id} className="border-none">
                  <Card className="glass border-white/5 rounded-[2rem] overflow-hidden">
                    <AccordionTrigger className="px-6 py-6 hover:no-underline">
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                          <service.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold font-headline">{service.name}</h4>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            service.status === 'online' ? "text-primary" : "text-destructive"
                          )}>{service.status}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-6 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{service.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="block text-[8px] font-black uppercase text-muted-foreground mb-1">Uptime</span>
                            <span className="text-sm font-bold">{service.uptime}</span>
                          </div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="block text-[8px] font-black uppercase text-muted-foreground mb-1">Latency</span>
                            <span className="text-sm font-bold text-primary">{service.latency}</span>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Incident Stream & Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Incident Stream */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
              <Terminal className="w-3 h-3 text-primary" /> Live Event Feed
            </h3>
            <Card className="glass border-white/5 rounded-[2.5rem] p-6 space-y-2 max-h-[400px] overflow-y-auto no-scrollbar relative">
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
              <div className="pt-4 space-y-2">
                <AnimatePresence initial={false}>
                  {incidents.map((incident) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-4 hover:bg-white/10 transition-colors"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0 mt-1.5",
                        incident.severity === 'high' ? "bg-destructive animate-pulse" : "bg-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/90 leading-relaxed font-medium">
                          <span className="text-[10px] font-bold uppercase text-primary mr-2">[{incident.type}]</span>
                          {incident.message}
                        </p>
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-2 block">{incident.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
            </Card>
          </div>

          {/* System Diagnostics Filtering */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
              <Filter className="w-3 h-3 text-primary" /> Advanced Diagnostics
            </h3>
            <Card className="glass border-white/5 rounded-[2.5rem] p-8 space-y-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs..." 
                    className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl text-xs"
                  />
                </div>
                <Button variant="outline" className="h-12 border-white/10 rounded-xl gap-2 text-xs font-bold uppercase tracking-widest">
                  Severity <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {[
                  { service: 'Protocol', msg: 'Key handshake successful', time: '14:22:01', status: 'pass' },
                  { service: 'AI Link', msg: 'Prompt token optimization', time: '14:21:44', status: 'pass' },
                  { service: 'Network', msg: 'Node switching: Sydney -> Tokyo', time: '14:20:12', status: 'warn' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        log.status === 'pass' ? "bg-primary" : "bg-yellow-500"
                      )} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white uppercase tracking-tight">{log.service}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{log.msg}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-muted-foreground font-mono">{log.time}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full h-14 bg-white/5 border border-white/10 hover:bg-primary hover:text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all">
                Export Full System Report <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </div>
        </div>

        {/* Footer Integrity Quote */}
        <div className="pt-12 text-center space-y-4">
           <div className="flex items-center justify-center gap-2 text-primary/40 text-[10px] font-black uppercase tracking-[0.4em]">
             <ShieldCheck className="w-4 h-4" /> End-To-End Security Active
           </div>
           <p className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
             HappyChat Network integrity is verified by distributed zero-trust architecture. 
             Status metrics are updated every 500ms via Edge Logic.
           </p>
        </div>

      </div>
    </div>
  );
}

