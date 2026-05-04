
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatView } from '@/components/ChatView';
import { Navbar } from '@/components/Navbar';
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [showTransition, setShowTransition] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    
    const timer = setTimeout(() => setShowTransition(false), 1500);
    return () => clearTimeout(timer);
  }, [user, isUserLoading, router]);

  if (isUserLoading || showTransition) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="relative z-10 text-center space-y-6"
        >
          <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto glow-green animate-pulse">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-headline text-white uppercase italic tracking-tighter">Initializing Session</h2>
            <div className="flex items-center justify-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
              <Loader2 className="w-4 h-4 animate-spin" />
              Securing Connection
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16">
        <ChatView />
      </div>
    </main>
  );
}
