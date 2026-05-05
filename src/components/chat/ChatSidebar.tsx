
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, MessageSquare } from 'lucide-react';
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

  // Fetch conversations for the current user
  // Simplified query: Removed orderBy to prevent index-related permission issues
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

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    
    // Sort manually in memory since we removed it from the Firestore query for safety
    const sorted = [...conversations].sort((a, b) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
      return timeB - timeA;
    });

    if (!searchQuery.trim()) return sorted;
    
    return sorted.filter(conv => {
      const otherId = conv.participantIds.find(id => id !== user?.uid);
      const profile = otherId ? chatProfiles[otherId] : null;
      return (
        profile?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [conversations, searchQuery, chatProfiles, user]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black font-headline text-white italic tracking-tighter uppercase">Messages</h2>
          <Button size="icon" variant="ghost" className="rounded-xl hover:bg-primary/10 hover:text-primary"><Plus className="w-5 h-5" /></Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..." 
            className="bg-white/5 border-white/5 pl-10 h-10 text-xs rounded-xl focus-visible:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-6 space-y-1">
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
                  "w-full p-4 rounded-2xl flex items-center gap-4 transition-all group border border-transparent",
                  isSelected 
                    ? "bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(0,200,83,0.1)]" 
                    : "hover:bg-white/5"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-12 h-12 border border-white/10">
                    <AvatarImage src={profile.profileImageUrl} />
                    <AvatarFallback>{profile.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-[#0a0a0a] glow-green" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm text-white truncate">{profile.fullName}</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-black">
                      {conv.updatedAt?.toDate ? formatDistanceToNow(conv.updatedAt.toDate(), { addSuffix: false }) : ''}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate italic">
                    {conv.lastMessage || `Start a secure session with ${profile.username}`}
                  </p>
                </div>
              </button>
            );
          })}

          {filteredConversations.length === 0 && !searchQuery && (
            <div className="p-12 text-center space-y-4 opacity-30">
              <MessageSquare className="w-8 h-8 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest italic">No Active Sessions</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
