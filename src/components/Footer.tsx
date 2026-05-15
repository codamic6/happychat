'use client';

import Link from 'next/link';
import { Github, Twitter, Instagram, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative group", className)}>
      <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-full h-full text-primary relative z-10"
      >
        <path d="M21 11.5C21 16.75 16.75 21 11.5 21c-1.92 0-3.7-.57-5.2-1.55L3 21l1.55-3.3c-1-1.5-1.55-3.28-1.55-5.2C3 7.25 7.25 3 12.5 3c5.25 0 8.5 4.25 8.5 8.5z" />
        <path d="m7 9 5 3.5 5-3.5v7H7V9z" />
      </svg>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-[#050505] pt-16 md:pt-32 pb-8 md:pb-12 overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-4 gap-12 md:gap-16 mb-16 md:mb-24">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <BrandLogo className="w-10 h-10 transition-transform group-hover:scale-110" />
              <span className="font-headline font-black text-2xl md:text-3xl tracking-tighter text-white uppercase">HappyChat</span>
            </Link>
            <p className="text-lg md:text-xl text-muted-foreground max-w-md font-medium leading-relaxed">
              Simple email-based messaging. Private communication through secure identity and high-end design.
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Instagram].map((Icon, i) => (
                <button key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8 md:gap-12 lg:col-span-2">
            <div className="space-y-4 md:space-y-6">
              <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-primary">Platform</h4>
              <ul className="space-y-3 md:space-y-4">
                {['Features', 'Security', 'Enterprise', 'Email Identity'].map((item) => (
                  <li key={item}>
                    <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-xs md:text-sm font-bold text-white/60 hover:text-white flex items-center gap-1 group transition-colors uppercase tracking-widest">
                      {item} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 md:space-y-6">
              <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-primary">Company</h4>
              <ul className="space-y-3 md:space-y-4">
                {['Privacy', 'Terms', 'Help', 'Status'].map((item) => (
                  <li key={item}>
                    <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-xs md:text-sm font-bold text-white/60 hover:text-white flex items-center gap-1 group transition-colors uppercase tracking-widest">
                      {item === 'Help' ? 'Help Center' : item} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 md:pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            © 2026 HappyChat Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary">App Active</span>
            </div>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Build Stable_01</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
