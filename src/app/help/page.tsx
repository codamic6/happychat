'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Info, HelpCircle, MessageSquare, Zap, Search, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';

export default function HelpPage() {
  const faqs = [
    {
      q: "Is HappyChat really secure?",
      a: "Yes. We use an advanced security system that keeps your messages safe. This means your messages are protected against current and future threats."
    },
    {
      q: "How do I recover my account?",
      a: "HappyChat is private. Your recovery keys are created on your device. If you lose them, even we cannot get your data back. Keep your recovery info in a safe place."
    },
    {
      q: "Can I use HappyChat on multiple devices?",
      a: "Yes. Our multi-device system syncs your key across your devices, allowing you to stay connected without losing any security."
    },
    {
      q: "What are 'Updates'?",
      a: "Updates are private, encrypted status messages that disappear after 24 hours. They are stored securely across our network."
    }
  ];

  return (
    <main className="min-h-screen bg-[#050505] overflow-x-hidden">
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-12 mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest uppercase"
            >
              <HelpCircle className="w-3 h-3" /> Help Center
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-9xl font-black font-headline text-gradient uppercase italic leading-none tracking-tighter"
            >
              How Can <br />We Help?
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-2xl mx-auto group"
            >
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search our help center..." 
                className="h-16 pl-16 pr-8 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary text-lg"
              />
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-24">
             <div className="lg:col-span-2 space-y-6">
                <div className="glass p-8 md:p-12 rounded-[3rem] border border-white/5">
                  <h2 className="text-3xl font-black font-headline text-white mb-10 uppercase italic tracking-tight">Common Questions</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, i) => (
                      <AccordionItem key={i} value={`item-${i}`} className="border-white/5 py-4">
                        <AccordionTrigger className="text-left text-lg font-bold text-white hover:text-primary transition-all uppercase tracking-tighter">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-4">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
             </div>

             <div className="space-y-6">
                <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                   <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                     <MessageSquare className="text-primary w-6 h-6" />
                   </div>
                   <h3 className="text-xl font-black font-headline text-white uppercase italic">Direct Support</h3>
                   <p className="text-sm text-muted-foreground leading-relaxed">Support channels are open 24/7 for our users.</p>
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest group">
                      Get Help Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                     <Zap className="text-white w-6 h-6" />
                   </div>
                   <h3 className="text-xl font-black font-headline text-white uppercase italic">Quick Start</h3>
                   <p className="text-sm text-muted-foreground leading-relaxed">Learn how to use the app in just a few minutes.</p>
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase text-white tracking-widest group">
                      Read the Guide <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>
          </div>

          <div className="text-center py-20 border-t border-white/5">
            <p className="text-muted-foreground font-medium text-lg">Still need help? Email us at <span className="text-primary font-black underline cursor-pointer">hello@happychat.io</span></p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}