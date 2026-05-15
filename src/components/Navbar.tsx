'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield, Info, Home, MessageSquare } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/firebase';

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

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/features', label: 'Features', icon: Info },
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
          <BrandLogo className="w-10 h-10" />
          <span className="font-headline font-black text-2xl tracking-tighter text-white uppercase">HappyChat</span>
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
          {!isUserLoading && (
            <>
              {user ? (
                <Link href="/chat" className="hidden md:block">
                  <Button className="h-11 px-8 glow-green hover:glow-green-bright transition-all duration-500 font-black uppercase text-[10px] tracking-widest rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    Open Chats <MessageSquare className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors px-6">
                    Login
                  </Link>
                  <Link href="/get-started" className="hidden md:block">
                    <Button className="h-11 px-8 glow-green hover:glow-green-bright transition-all duration-500 font-black uppercase text-[10px] tracking-widest rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}
          
          {/* Mobile Access Point */}
          <div className="flex items-center gap-2">
            {!isUserLoading && user && (
              <Link href="/chat" className="md:hidden">
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 h-12 w-12 rounded-xl border border-primary/20">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </Link>
            )}

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
                      <BrandLogo className="w-10 h-10" />
                      <span className="font-headline font-black text-2xl tracking-tighter text-white uppercase">HappyChat</span>
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
                      
                      {user && (
                        <Link
                          href="/chat"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-6 rounded-[2rem] text-2xl font-black uppercase text-primary hover:bg-primary/10 transition-all group bg-[#0d0d0d] border border-primary/20 mb-8 glow-green"
                        >
                          <div className="flex items-center gap-6">
                             <MessageSquare className="w-6 h-6" />
                             My Chats
                          </div>
                          <div className="w-4 h-4">
                            <BrandLogo className="w-full h-full" />
                          </div>
                        </Link>
                      )}

                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-6 rounded-[2rem] text-2xl font-black uppercase text-white hover:bg-primary/10 hover:text-primary transition-all group bg-[#0d0d0d] border border-white/5"
                        >
                          <div className="flex items-center gap-6">
                             <link.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                             {link.label}
                          </div>
                          <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <BrandLogo className="w-full h-full" />
                          </div>
                        </Link>
                      ))}
                    </div>

                    {!isUserLoading && !user && (
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
                    )}
                  </div>

                  <div className="p-8 border-t border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground tracking-widest">
                      <span className="italic">Version 1.0.2 Stable</span>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         <span className="text-primary uppercase tracking-[0.2em]">Secure App</span>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
