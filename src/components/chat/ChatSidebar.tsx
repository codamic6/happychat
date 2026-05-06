'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  email: string;
  profileImageUrl?: string;
};

type Conversation = {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  updatedAt: any;
  unreadCount?: Record<string, number>;
};

function formatShortTime(date: Date) {
  const now = new Date();
  const diffMin = differenceInMinutes(now, date);
  const diffHour = differenceInHours(now, date);
  const diffDay = differenceInDays(now, date);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHour < 24) return `${diffHour}h`;
  return format(date, 'dd/MM/yy');
}

/**
 * Manually truncates a string to 12 characters followed by dots.
 */
function manualTruncate(text: string, limit: number = 12) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}

function ChatItem({ conv, profile, user, isSelected, onClick }: { conv: Conversation, profile: UserProfile, user: any, isSelected: boolean, onClick: () => void }) {
  const [imageError, setImageError] = useState(false);
  const unreadCount = conv.unreadCount?.[user?.uid || ''] || 0;
  const name = profile.displayName || profile.fullName || 'User';
  const initial = name.charAt(0).toUpperCase();
  
  // Apply manual 12-char truncation
  const messagePreview = manualTruncate(conv.lastMessage || 'Secure chat...', 12);

  // Use the new URL-based proxy with key encoding preserved
  const avatarSrc = profile.profileImageUrl?.includes('mega.nz') 
    ? `/api/avatar?url=${encodeURIComponent(profile.profileImageUrl)}&t=${Date.now()}` 
    : null;

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-3xl flex items-center gap-4 transition-all group border border-transparent overflow-hidden max-w-full relative",
        isSelected 
          ? "bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(0,200,83,0.1)]" 
          : "hover:bg-white/5"
      )}
    >
      <div className="relative shrink-0 flex-none">
        <div className="w-14 h-14 rounded-full border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center">
          {!imageError && avatarSrc ? (
            <img 
              src={avatarSrc} 
              alt={name} 
              className="w-full h-full object-cover" 
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-xl font-bold text-primary">{initial}</div>
          )}
        </div>
        <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-[#0d0d0d] glow-green" />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-left pr-4">
        <div className="flex items-center justify-between gap-2 min-w-0 w-full mb-1">
          <span className="font-bold text-sm text-white truncate min-w-0 flex-1 overflow-hidden whitespace-nowrap">
            {name}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter flex-none">
            {conv.updatedAt?.toDate ? formatShortTime(conv.updatedAt.toDate()) : ''}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-3 min-w-0 w-full overflow-hidden">
          <p className={cn(
            "text-[11px] min-w-0 flex-1 overflow-hidden whitespace-nowrap",
            unreadCount > 0 ? "text-white font-bold" : "text-muted-foreground"
          )}>
            {messagePreview}
          </p>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shrink-0 flex-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export function ChatSidebar() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  const convQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
  }, [db, user]);

  const { data: rawConversations } = useCollection<Conversation>(convQuery);

  const conversations = useMemo(() => {
    if (!rawConversations) return [];
    return [...rawConversations].sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  }, [rawConversations]);

  const [chatProfiles, setChatProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!conversations || !db || !user) return;

    const fetchOtherParticipantProfiles = async () => {
      const newProfiles = { ...chatProfiles };
      const missingUids = new Set<string>();

      conversations.forEach(conv => {
        const otherId = conv.participantIds.find(id => id !== user.uid);
        if (otherId && !newProfiles[otherId]) {
          missingUids.add(otherId);
        }
      });

      if (missingUids.size > 0) {
        for (const uid of Array.from(missingUids)) {
          const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', uid)));
          if (!userDoc.empty) {
            newProfiles[uid] = userDoc.docs[0].data() as UserProfile;
          }
        }
        setChatProfiles(newProfiles);
      }
    };

    fetchOtherParticipantProfiles();
  }, [conversations, db, user, chatProfiles]);

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;
    
    return conversations.filter(conv => {
      const otherId = conv.participantIds.find(id => id !== user?.uid);
      const profile = otherId ? chatProfiles[otherId] : null;
      const name = profile?.displayName || profile?.fullName || '';
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [conversations, searchQuery, chatProfiles, user]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] w-full overflow-hidden border-r border-white/5">
      <div className="p-4 md:p-6 space-y-6 flex-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold font-headline text-white tracking-tighter uppercase">Chats</h2>
          </div>
          <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-muted-foreground">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..." 
            className="bg-white/5 border-white/10 pl-12 h-12 text-sm rounded-full focus-visible:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 w-full overflow-hidden">
        <div className="px-3 pb-24 md:pb-6 space-y-1 w-full min-w-0 overflow-hidden">
          {filteredConversations.map((conv) => {
            const otherId = conv.participantIds.find(id => id !== user?.uid);
            const profile = otherId ? chatProfiles[otherId] : null;
            if (!profile) return null;

            return (
              <ChatItem 
                key={conv.id}
                conv={conv}
                profile={profile}
                user={user}
                isSelected={pathname === `/chat/${conv.id}`}
                onClick={() => router.push(`/chat/${conv.id}`)}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}