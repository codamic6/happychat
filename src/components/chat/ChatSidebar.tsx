
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, MessageSquare, Zap, MoreVertical, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
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
  }, [conversations, db, user]);

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
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black font-headline text-white italic tracking-tighter uppercase">HappyChat</h2>
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
            placeholder="Search chats..." 
            className="bg-white/5 border-white/10 pl-12 h-12 text-sm rounded-full focus-visible:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-24 md:pb-6 space-y-1">
          {filteredConversations.map((conv) => {
            const otherId = conv.participantIds.find(id => id !== user?.uid);
            const profile = otherId ? chatProfiles[otherId] : null;
            if (!profile) return null;

            const isSelected = pathname === `/chat/${conv.id}`;
            const unreadCount = conv.unreadCount?.[user?.uid || ''] || 0;
            const name = profile.displayName || profile.fullName || 'User';
            const initials = (profile.displayName || profile.fullName || 'U').charAt(0).toUpperCase();

            // Real image logic only
            const hasRealImage = profile.profileImageUrl && profile.profileImageUrl.includes('mega.nz');
            const avatarSrc = hasRealImage ? `/api/avatar/${profile.id}?t=${Date.now()}` : null;

            return (
              <button 
                key={conv.id}
                onClick={() => router.push(`/chat/${conv.id}`)}
                className={cn(
                  "w-full p-4 rounded-3xl flex items-center gap-4 transition-all group border border-transparent",
                  isSelected 
                    ? "bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(0,200,83,0.1)]" 
                    : "hover:bg-white/5"
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center">
                    {avatarSrc ? (
                      <img 
                        src={avatarSrc} 
                        alt={name} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = "w-full h-full flex items-center justify-center text-xl font-black text-primary";
                            fallback.innerText = initials;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="text-xl font-black text-primary">{initials}</div>
                    )}
                  </div>
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-[#0d0d0d] glow-green" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white truncate">{name}</span>
                    <span className="text-[9px] uppercase font-black tracking-tighter text-muted-foreground">
                      {conv.updatedAt?.toDate ? formatDistanceToNow(conv.updatedAt.toDate(), { addSuffix: false }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-[11px] truncate italic max-w-[80%]",
                      unreadCount > 0 ? "text-white font-bold" : "text-muted-foreground"
                    )}>
                      {conv.lastMessage || `Encrypted link active`}
                    </p>
                    {unreadCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-black rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
