
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { IconRail } from '@/components/chat/IconRail';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Determine if we are on a specific chat ID route
  const isAtConversation = pathname.startsWith('/chat/') && pathname !== '/chat';

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    const timer = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, [user, isUserLoading, router]);

  if (isUserLoading || isInitialLoading) {
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
            <h2 className="text-2xl font-black font-headline text-white italic tracking-tighter uppercase">Initializing OS</h2>
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
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative">
      {/* Icon Rail - Responsive: Fixed on Desktop, Bottom on Mobile Layout (implied by design goal) */}
      <div className={cn(
        "hidden md:block shrink-0 h-full",
        isAtConversation && "hidden lg:block"
      )}>
        <IconRail />
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Chat Sidebar - Hidden on Mobile if in Conversation Route */}
        <aside className={cn(
          "w-full md:w-80 border-r border-white/5 bg-[#0d0d0d] flex flex-col shrink-0 h-full",
          isAtConversation && "hidden md:flex"
        )}>
          <ChatSidebar />
        </aside>

        {/* Main Area: Page Content (ConversationView or EmptyState) */}
        <main className={cn(
          "flex-1 flex flex-col relative bg-[#050505] h-full overflow-hidden",
          !isAtConversation && "hidden md:flex"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
