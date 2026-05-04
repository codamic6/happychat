
"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Menu, X, Sparkles, Shield, Info, Home } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet';
import { useState } from 'react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/features', label: 'Features', icon: Zap },
    { href: '/security', label: 'Security', icon: Shield },
    { href: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { href: '/help', label: 'Help', icon: Info },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 h-16 flex items-center justify-between">
      {/* Brand Logo - Always Left */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-green">
          <Zap className="text-primary-foreground h-5 w-5 fill-current" />
        </div>
        <span className="font-headline font-black text-xl tracking-tight text-white uppercase italic">HappyChat</span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.slice(1).map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Link href="/login" className="hidden md:block text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors px-4">Login</Link>
        <Link href="/get-started" className="hidden md:block">
          <Button className="glow-green hover:glow-green-bright transition-all duration-300 font-black uppercase text-xs tracking-widest">Get Started</Button>
        </Link>
        
        {/* Mobile Menu Trigger - Now on the Right */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/5">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90%] bg-[#050505] border-l border-white/5 p-0 flex flex-col">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>Explore HappyChat features, security, and assistant.</SheetDescription>
              </SheetHeader>
              
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-green">
                    <Zap className="text-primary-foreground h-5 w-5 fill-current" />
                  </div>
                  <span className="font-headline font-black text-xl tracking-tight text-white uppercase italic">HappyChat</span>
                </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                    <X className="w-6 h-6" />
                  </Button>
                </SheetClose>
              </div>

              <div className="flex-1 overflow-y-auto py-8 px-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-4">Navigation</p>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 p-4 rounded-xl text-lg font-black uppercase text-white hover:bg-primary/10 hover:text-primary transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors border border-white/5">
                        <link.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-12 space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-4">Account</p>
                  <Link href="/get-started" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-14 text-lg font-black uppercase tracking-widest glow-green">Get Started</Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full h-14 text-lg font-black uppercase tracking-widest border-white/10">Login</Button>
                  </Link>
                </div>
              </div>

              <div className="p-6 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground tracking-widest">
                  <span>VERSION 1.0.4</span>
                  <span className="text-primary">● SYSTEM ACTIVE</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
