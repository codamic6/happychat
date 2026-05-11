'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { IconRail } from '@/components/chat/IconRail';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { StatusSidebar } from '@/components/chat/StatusSidebar';
import { Loader2, Sparkles, MessageSquare, Globe, Users, UserCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Global Presence Heartbeat
  useEffect(() => {
    if (!user || !db) return;

    const userRef = doc(db, 'users', user.uid);
    
    const setOnlineStatus = (status: boolean) => {
      updateDoc(userRef, {
        isOnline: status,
        updatedAt: serverTimestamp()
      }).catch(() => {});
    };

    // Set online on mount
    setOnlineStatus(true);

    // Set offline on unmount/background
    const handleVisibilityChange = () => {
      setOnlineStatus(document.visibilityState === 'visible');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => setOnlineStatus(false));

    return () => {
      setOnlineStatus(false);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, db]);

  // Define pages that should NOT be treated as specific conversation views
  const isExcludedFromConversation = [
    '/chat',
    '/chat/profile',
    '/chat/status',
    '/chat/contacts',
    '/chat/archived',
    '/chat/settings'
  ].includes(pathname);

  const isAtConversation = pathname.startsWith('/chat/') && !isExcludedFromConversation;
  const isProfilePage = pathname === '/chat/profile';
  const isStatusPage = pathname === '/chat/status';
  const isContactsPage = pathname === '/chat/contacts';
  const isViewingStatus = isStatusPage && !!searchParams.get('uid');

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
            <h2 className="text-2xl font-bold font-headline text-white tracking-tighter uppercase text-gradient italic">HappyChat</h2>
            <div className="flex items-center justify-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Initializing Shard...
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  if (!user) return null;

  const mobileTabs = [
    { label: 'Chats', icon: MessageSquare, href: '/chat' },
    { label: 'Updates', icon: Globe, href: '/chat/status' },
    { label: 'Contacts', icon: Users, href: '/chat/contacts' },
    { label: 'Profile', icon: UserCircle, href: '/chat/profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden relative">
      <header className={cn(
        "md:hidden flex items-center justify-between px-6 h-16 border-b border-white/5 bg-[#0a0a0a] shrink-0 z-50",
        (isAtConversation || isProfilePage || isViewingStatus || isContactsPage) && "hidden"
      )}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-green">
            <Zap className="text-primary-foreground h-5 w-5 fill-current" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight text-white uppercase italic">HappyChat</span>
        </Link>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
           <Users className="w-4 h-4 text-muted-foreground" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden h-full">
        <div className={cn(
          "hidden md:block shrink-0 h-full",
          (isAtConversation || isViewingStatus) && "hidden lg:block"
        )}>
          <IconRail />
        </div>

        <div className="flex flex-1 overflow-hidden h-full relative">
          <aside className={cn(
            "w-full md:w-80 border-r border-white/5 bg-[#0d0d0d] flex flex-col shrink-0 h-full transition-all duration-300",
            (isAtConversation || isProfilePage || isViewingStatus || isContactsPage) ? "hidden md:flex" : "flex"
          )}>
            {isStatusPage ? <StatusSidebar /> : <ChatSidebar />}
          </aside>

          <main className={cn(
            "flex-1 flex flex-col relative bg-[#050505] h-full overflow-hidden",
            (!isAtConversation && !isProfilePage && !isViewingStatus && !isContactsPage) && "hidden md:flex"
          )}>
            {children}
          </main>
        </div>
      </div>

      <nav className={cn(
        "md:hidden h-20 bg-[#0d0d0d] border-t border-white/5 flex items-center justify-around px-4 pb-safe shrink-0 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]",
        (isAtConversation || isProfilePage || isViewingStatus || isContactsPage) && "hidden"
      )}>
        {mobileTabs.map((tab, idx) => {
          const isActive = pathname === tab.href;
          return (
            <Link key={idx} href={tab.href} className="flex flex-col items-center gap-1 group">
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive ? "bg-primary/20 text-primary glow-green" : "text-muted-foreground group-hover:text-white"
              )}>
                <tab.icon className="w-6 h-6" />
              </div>
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-widest",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </Suspense>
  );
}
