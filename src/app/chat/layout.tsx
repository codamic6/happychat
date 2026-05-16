'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { IconRail } from '@/components/chat/IconRail';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { StatusSidebar } from '@/components/chat/StatusSidebar';
import { Loader2, MessageSquare, Globe, Users, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative group", className)}>
      <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
      <Image 
        src="/Logoo.png" 
        alt="HappyChat Logo" 
        width={100} 
        height={100} 
        className="relative z-10 w-full h-full object-contain"
        priority
      />
    </div>
  );
}

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

    setOnlineStatus(true);

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
  const isArchivedPage = pathname === '/chat/archived';
  const isSettingsPage = pathname === '/chat/settings';
  
  const isViewingStatus = isStatusPage && !!searchParams.get('uid');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center space-y-6"
        >
          <div className="w-24 h-24 flex items-center justify-center mx-auto">
            <BrandLogo className="w-full h-full" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-white tracking-tighter uppercase">HappyChat</h2>
            <div className="flex items-center justify-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting App...
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

  const shouldHideSidebarOnMobile = isAtConversation || isProfilePage || isViewingStatus || isContactsPage || isArchivedPage || isSettingsPage;
  const shouldHideMainOnMobile = !shouldHideSidebarOnMobile;

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden relative">
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
            shouldHideSidebarOnMobile ? "hidden md:flex" : "flex"
          )}>
            {isStatusPage ? <StatusSidebar /> : <ChatSidebar />}
          </aside>

          <main className={cn(
            "flex-1 flex flex-col relative bg-[#050505] h-full overflow-hidden",
            shouldHideMainOnMobile && "hidden md:flex"
          )}>
            {children}
          </main>
        </div>
      </div>

      <nav className={cn(
        "md:hidden h-20 bg-[#0d0d0d] border-t border-white/5 flex items-center justify-around px-4 pb-safe shrink-0 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]",
        shouldHideSidebarOnMobile && "hidden"
      )}>
        {mobileTabs.map((tab, idx) => {
          const isActive = pathname === tab.href;
          return (
            <Link key={idx} href={tab.href} prefetch={true} className="flex flex-col items-center gap-1 group">
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
