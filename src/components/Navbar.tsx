
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Menu, X, Shield, Info, Home } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/features', label: 'Features', icon: Zap },
    { href: '/security', label: 'Security', icon: Shield },
    { href: '/help', label: 'Help', icon: Info },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 h-20 flex items-center justify-between",
        isScrolled ? "bg-black/60 backdrop-blur-2xl border-b border-white/5 h-16" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-green transition-transform group-hover:scale-110">
            <Zap className="text-primary-foreground h-6 w-6 fill-current" />
          </div>
          <span className="font-headline font-black text-2xl tracking-tighter text-white uppercase italic">HappyChat</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.slice(1).map((link) => (
            <Link key={link.href} href={link.href} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-all duration-300">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors px-6">
            Login
          </Link>
          <Link href="/get-started" className="hidden md:block">
            <Button className="h-11 px-8 glow-green hover:glow-green-bright transition-all duration-500 font-black uppercase text-[10px] tracking-widest rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              Get Started
            </Button>
          </Link>
          
          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/5 h-12 w-12 rounded-xl">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full bg-[#050505] border-l border-white/5 p-0 flex flex-col">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Access platform sections and account management.</SheetDescription>
                </SheetHeader>
                
                <div className="p-8 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]">
                  <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-green">
                      <Zap className="text-primary-foreground h-6 w-6 fill-current" />
                    </div>
                    <span className="font-headline font-black text-2xl tracking-tighter text-white italic uppercase">HappyChat</span>
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white h-10 w-10">
                      <X className="w-6 h-6" />
                    </Button>
                  </SheetClose>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-12">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-primary tracking-[0.3em] uppercase mb-8">Navigation</p>
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-6 rounded-[2rem] text-2xl font-black italic uppercase text-white hover:bg-primary/10 hover:text-primary transition-all group bg-[#0d0d0d] border border-white/5"
                      >
                        <div className="flex items-center gap-6">
                           <link.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                           {link.label}
                        </div>
                        <Zap className="w-4 h-4 opacity-0 group-hover:opacity-100 text-primary" />
                      </Link>
                    ))}
                  </div>

                  <div className="space-y-4 pt-12 border-t border-white/5">
                    <p className="text-[10px] font-black text-primary tracking-[0.3em] uppercase mb-8">Account Control</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Link href="/get-started" onClick={() => setIsOpen(false)}>
                        <Button className="w-full h-20 text-sm font-black uppercase tracking-widest glow-green rounded-[2rem]">Join</Button>
                      </Link>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full h-20 text-sm font-black uppercase tracking-widest border-white/10 rounded-[2rem] bg-white/5">Login</Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-[#0a0a0a]">
                  <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground tracking-widest">
                    <span className="italic">Protocol v2.4.0</span>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                       <span className="text-primary uppercase tracking-[0.2em]">Secure Node</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
