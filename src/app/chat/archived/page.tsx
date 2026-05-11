
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Archive, ArrowLeft, Search, ArchiveX, 
  MessageSquare, UserCircle, Loader2, MoreVertical 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, query, where, doc, updateDoc, 
  arrayRemove, onSnapshot 
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
};

type Conversation = {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  updatedAt: any;
  archivedBy?: string[];
};

export default function ArchivedChatsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});

  const archivedQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
  }, [db, user]);

  const { data: allConvs, isLoading } = useCollection<Conversation>(archivedQuery);

  const archivedConvs = useMemo(() => {
    if (!allConvs || !user) return [];
    return allConvs.filter(c => c.archivedBy?.includes(user.uid));
  }, [allConvs, user]);

  useEffect(() => {
    if (!archivedConvs || !db || !user) return;
    const unsubs: (() => void)[] = [];
    archivedConvs.forEach(conv => {
      const otherId = conv.participantIds.find(id => id !== user.uid);
      if (otherId && !profiles[otherId]) {
        const unsub = onSnapshot(doc(db, 'users', otherId), (snap) => {
          if (snap.exists()) {
            setProfiles(prev => ({ ...prev, [otherId]: snap.data() as UserProfile }));
          }
        });
        unsubs.push(unsub);
      }
    });
    return () => unsubs.forEach(u => u());
  }, [archivedConvs, db, user]);

  const filtered = archivedConvs.filter(c => {
    const otherId = c.participantIds.find(id => id !== user?.uid);
    const p = otherId ? profiles[otherId] : null;
    const name = p?.displayName || p?.fullName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const unarchiveChat = async (convId: string) => {
    if (!user || !db) return;
    try {
      await updateDoc(doc(db, 'conversations', convId), {
        archivedBy: arrayRemove(user.uid)
      });
      toast({ title: "Restored", description: "Chat returned to Recents." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Restore protocol failed." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050505] h-full overflow-hidden">
      <header className="h-24 px-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-xl z-[60] sticky top-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="text-white/60 hover:text-white rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black font-headline text-gradient tracking-tight uppercase italic">Archived Vault</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Storage Shard Alpha</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 bg-gradient-to-b from-black/20 to-transparent flex-none">
        <div className="relative group max-w-3xl mx-auto shadow-2xl">
          <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl flex items-center px-4 h-14 group-focus-within:border-primary/50 transition-all">
            <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the vault..." 
              className="bg-transparent border-none text-white text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-full w-full"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="max-w-5xl mx-auto p-6 md:p-10 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-32">
            <AnimatePresence mode="popLayout">
              {filtered.map((conv) => {
                const otherId = conv.participantIds.find(id => id !== user?.uid);
                const p = otherId ? profiles[otherId] : null;
                const name = p?.displayName || p?.fullName || 'Secure User';
                
                return (
                  <motion.div
                    key={conv.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass border-white/5 p-5 rounded-[2rem] flex items-center gap-4 hover:border-primary/30 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shrink-0">
                       <span className="text-xl font-bold text-primary">{name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className="font-bold text-white uppercase tracking-tight truncate font-headline">{name}</h3>
                       <p className="text-[10px] text-muted-foreground truncate">{conv.lastMessage || 'End-to-end encrypted storage...'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => router.push(`/chat/${conv.id}`)}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest"
                      >
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#111] border-white/10 p-1 rounded-xl">
                           <DropdownMenuItem onClick={() => unarchiveChat(conv.id)} className="gap-3 p-3 rounded-lg cursor-pointer hover:bg-primary/10 text-white text-[10px] font-bold uppercase tracking-widest">
                             <ArchiveX className="w-4 h-4" /> Unarchive
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center border border-dashed border-white/20">
                <Archive className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-widest text-white">Vault Empty</h3>
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground max-w-xs leading-relaxed">No archived shards found in current encryption layer</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
