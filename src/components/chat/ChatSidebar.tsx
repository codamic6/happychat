
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, MessageSquare, Zap, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type UserProfile = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profileImageUrl: string;
};

type Conversation = {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  updatedAt: any;
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
      where('participantIds', 'array-contains', user.uid),
      limit(50)
    );
  }, [db, user]);

  const { data: conversations } = useCollection<Conversation>(convQuery);
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
        for (const uid of missingUids) {
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

  const sortedConversations = useMemo(() => {
    if (!conversations) return [];
    return [...conversations].sort((a, b) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
      return timeB - timeA;
    });
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return sortedConversations;
    return sortedConversations.filter(conv => {
      const otherId = conv.participantIds.find(id => id !== user?.uid);
      const profile = otherId ? chatProfiles[otherId] : null;
      return (
        profile?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [sortedConversations, searchQuery, chatProfiles, user]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      {/* Header Area */}
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-green md:hidden">
              <Zap className="text-primary-foreground h-5 w-5 fill-current" />
            </div>
            <h2 className="text-xl md:text-2xl font-black font-headline text-white italic tracking-tighter uppercase">HappyChat</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-muted-foreground md:hidden">
              <Plus className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-muted-foreground">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats, contacts..." 
            className="bg-white/5 border-white/10 pl-12 h-12 text-sm rounded-full focus-visible:ring-primary focus-visible:ring-offset-0 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-24 md:pb-6 space-y-1">
          {filteredConversations.map((conv) => {
            const otherId = conv.participantIds.find(id => id !== user?.uid);
            const profile = otherId ? chatProfiles[otherId] : null;
            if (!profile) return null;

            const isSelected = pathname === `/chat/${conv.id}`;

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
                  <Avatar className="w-14 h-14 border border-white/10 shadow-lg">
                    <AvatarImage src={profile.profileImageUrl} />
                    <AvatarFallback className="bg-white/5 text-white font-black">{profile.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-[#0d0d0d] glow-green" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white truncate">{profile.fullName}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">
                      {conv.updatedAt?.toDate ? formatDistanceToNow(conv.updatedAt.toDate(), { addSuffix: false }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground truncate italic max-w-[80%]">
                      {conv.lastMessage || `Secure line established with @${profile.username}`}
                    </p>
                    {/* Placeholder for unread badge if needed */}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="p-20 text-center space-y-4 opacity-20">
              <MessageSquare className="w-12 h-12 mx-auto text-primary" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-[0.3em] italic">No active sessions</p>
                <p className="text-[10px] uppercase tracking-widest">Protocol status: idle</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
