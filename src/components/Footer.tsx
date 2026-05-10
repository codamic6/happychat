
'use client';

import Link from 'next/link';
import { Zap, Github, Twitter, Instagram, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function Footer() {
  return (
    <footer className="relative bg-[#050505] pt-32 pb-12 overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-4 gap-16 mb-24">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-green transition-transform group-hover:scale-110">
                <Zap className="text-primary-foreground h-6 w-6 fill-current" />
              </div>
              <span className="font-headline font-black text-3xl tracking-tighter text-white italic uppercase">HappyChat</span>
            </Link>
            <p className="text-xl text-muted-foreground max-w-md font-medium leading-relaxed">
              Redefining the standard of private communication through zero-knowledge architecture and cinematic design.
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Instagram].map((Icon, i) => (
                <button key={i} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-12 lg:col-span-2">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Platform</h4>
              <ul className="space-y-4">
                {['Features', 'Security', 'Enterprise', 'API Portal'].map((item) => (
                  <li key={item}>
                    <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm font-bold text-white/60 hover:text-white flex items-center gap-1 group transition-colors uppercase tracking-widest">
                      {item} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Company</h4>
              <ul className="space-y-4">
                {['Privacy', 'Terms', 'Help Center', 'Status'].map((item) => (
                  <li key={item}>
                    <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm font-bold text-white/60 hover:text-white flex items-center gap-1 group transition-colors uppercase tracking-widest">
                      {item} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            © 2024 HappyChat Inc. All protocols reserved.
          </p>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-primary">Global Network Active</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Build 0x9928AF</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
