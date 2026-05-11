
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, MoreVertical, Pin, Trash2, User, ChevronRight, X, 
  PinOff, Info, ArrowLeft, MessageCircle, Archive, CheckCircle, 
  UserCircle, Settings, ArchiveX, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, query, getDocs, where, doc, updateDoc, 
  onSnapshot, orderBy, arrayUnion, arrayRemove, writeBatch 
} from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { AddContactDialogContent } from '@/components/chat/AddContactDialogContent';

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  email: string;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  about?: string;
  phoneNumber?: string;
};

type ContactRecord = {
  id: string;
  userId: string;
  customName?: string;
};

type Conversation = {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  updatedAt: any;
  unreadCount?: Record<string, number>;
  pinnedBy?: string[];
  archivedBy?: string[];
  hiddenFor?: string[];
};

type StatusUpdate = {
  id: string;
  userId: string;
  content: string;
  type: 'text';
  createdAt: any;
  expiresAt: any;
  viewedBy?: string[];
};

function formatShortTime(date: Date, isMobile: boolean) {
  const now = new Date();
  const diffSec = differenceInSeconds(now, date);
  const diffMin = differenceInMinutes(now, date);
  const diffHour = differenceInHours(now, date);
  const diffDay = differenceInDays(now, date);

  if (diffSec < 60) return 'JUST NOW';

  if (isMobile) {
    if (diffMin < 60) return `${diffMin}M`;
    if (diffHour < 24) return `${diffHour}H`;
    return `${diffDay}D`;
  } else {
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return format(date, 'dd/MM/yy');
  }
}

function SegmentedRing({ count, hasUnseen, size = 56 }: { count: number, hasUnseen: boolean, size?: number }) {
  if (count === 0) return null;
  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;
  const gap = count > 1 ? 4 : 0;
  const segmentLength = (circumference - (gap * count)) / count;
  const color = hasUnseen ? "hsl(var(--primary))" : "rgba(255, 255, 255, 0.15)";

  return (
    <svg 
      width={size} 
      height={size} 
      className="absolute inset-0 -rotate-90 pointer-events-none z-10"
    >
      {Array.from({ length: count }).map((_, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${segmentLength} ${gap}`}
          strokeDashoffset={-(i * (segmentLength + gap))}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      ))}
    </svg>
  );
}

export function ChatSidebar() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  const [manageChatId, setManageChatId] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);

  const convQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
  }, [db, user]);

  const { data: rawConversations } = useCollection<Conversation>(convQuery);

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'contacts'));
  }, [db, user]);

  const { data: userContacts } = useCollection<ContactRecord>(contactsQuery);

  const statusQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'statuses'),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt', 'desc')
    );
  }, [db]);
  const { data: activeStatuses } = useCollection<StatusUpdate>(statusQuery);

  const statusMap = useMemo(() => {
    if (!activeStatuses || !user) return {};
    const map: Record<string, { count: number, hasUnseen: boolean }> = {};
    activeStatuses.forEach(s => {
      if (!map[s.userId]) map[s.userId] = { count: 0, hasUnseen: false };
      map[s.userId].count++;
      if (!s.viewedBy?.includes(user.uid)) map[s.userId].hasUnseen = true;
    });
    return map;
  }, [activeStatuses, user]);

  const [chatProfiles, setChatProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!rawConversations || !db || !user) return;
    const unsubs: (() => void)[] = [];
    rawConversations.forEach(conv => {
      const otherId = conv.participantIds.find(id => id !== user.uid);
      if (otherId && !chatProfiles[otherId]) {
        const unsub = onSnapshot(doc(db, 'users', otherId), (snap) => {
          if (snap.exists()) {
            setChatProfiles(prev => ({ ...prev, [otherId]: snap.data() as UserProfile }));
          }
        });
        unsubs.push(unsub);
      }
    });
    return () => unsubs.forEach(u => u());
  }, [rawConversations, db, user]);

  const contactAliasMap = useMemo(() => {
    if (!userContacts) return {};
    return userContacts.reduce((acc, c) => {
      acc[c.userId] = c;
      return acc;
    }, {} as Record<string, ContactRecord>);
  }, [userContacts]);

  const sortedConversations = useMemo(() => {
    if (!rawConversations || !user) return [];
    const filtered = rawConversations.filter(c => 
      !c.hiddenFor?.includes(user.uid) && 
      !c.archivedBy?.includes(user.uid)
    );
    return [...filtered].sort((a, b) => {
      const isPinnedA = a.pinnedBy?.includes(user.uid) ? 1 : 0;
      const isPinnedB = b.pinnedBy?.includes(user.uid) ? 1 : 0;
      if (isPinnedA !== isPinnedB) return isPinnedB - isPinnedA;
      const timeA = a.updatedAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  }, [rawConversations, user]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return sortedConversations;
    return sortedConversations.filter(conv => {
      const otherId = conv.participantIds.find(id => id !== user?.uid);
      const profile = otherId ? chatProfiles[otherId] : null;
      const contact = otherId ? contactAliasMap[otherId] : null;
      const name = contact?.customName || profile?.displayName || profile?.fullName || '';
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [sortedConversations, searchQuery, chatProfiles, contactAliasMap, user]);

  const togglePin = async (convId: string, isCurrentlyPinned: boolean) => {
    if (!user || !db) return;
    const convRef = doc(db, 'conversations', convId);
    try {
      await updateDoc(convRef, { pinnedBy: isCurrentlyPinned ? arrayRemove(user.uid) : arrayUnion(user.uid) });
      toast({ title: isCurrentlyPinned ? "Unpinned" : "Pinned", description: "Priority updated." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Pin protocol failed." });
    }
  };

  const archiveChat = async (convId: string) => {
    if (!user || !db) return;
    const convRef = doc(db, 'conversations', convId);
    try {
      await updateDoc(convRef, { archivedBy: arrayUnion(user.uid) });
      toast({ title: "Chat Archived", description: "Moved to storage." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Archiving failed." });
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || !db || !rawConversations) return;
    const batch = writeBatch(db);
    rawConversations.forEach(conv => {
      if (conv.unreadCount?.[user.uid] && conv.unreadCount[user.uid] > 0) {
        const ref = doc(db, 'conversations', conv.id);
        batch.update(ref, { [`unreadCount.${user.uid}`]: 0 });
      }
    });
    await batch.commit();
    toast({ title: "All Read", description: "Network cleared." });
  };

  const handleClearChat = async (convId: string) => {
    if (!user || !db) return;
    try {
      const q = query(collection(db, 'conversations', convId, 'messages'));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      
      // Update individual messages to hide them for this user
      snap.docs.forEach(docSnap => { 
        batch.update(docSnap.ref, { deletedFor: arrayUnion(user.uid) }); 
      });

      // Clear the conversation-level lastMessage string so it doesn't show in the sidebar
      const convRef = doc(db, 'conversations', convId);
      batch.update(convRef, { lastMessage: "" });

      await batch.commit();
      toast({ title: "Signal Cleared", description: "History scrubbed locally." });
      setManageChatId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Wipe operation failed." });
    }
  };

  const handleDeleteChat = async (convId: string) => {
    if (!user || !db) return;
    const convRef = doc(db, 'conversations', convId);
    try {
      await updateDoc(convRef, { hiddenFor: arrayUnion(user.uid) });
      toast({ title: "Node Removed", description: "Conversation shard hidden." });
      setIsSelectionMode(false);
      setSelectedConvId(null);
      setManageChatId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Deletion failed." });
    }
  };

  const handlePointerDown = (id: string) => {
    if (!isMobile) return;
    holdTimer.current = setTimeout(() => {
      setSelectedConvId(id);
      setIsSelectionMode(true);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 700);
  };

  const handlePointerUp = () => { if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; } };

  const handleChatClick = (id: string) => {
    if (isSelectionMode) {
      setSelectedConvId(id === selectedConvId ? null : id);
      if (id === selectedConvId) setIsSelectionMode(false);
      return;
    }
    router.push(`/chat/${id}`);
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] w-full overflow-hidden border-r border-white/5 shadow-2xl">
      <header className="flex-none p-6 pb-2 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] font-black tracking-widest uppercase">
                <MessageCircle className="w-2 h-2" /> Protocol v2.6
             </div>
             <h2 className="text-3xl font-black font-headline text-white tracking-tighter uppercase italic">Recents</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-2xl hover:bg-white/5 text-muted-foreground w-12 h-12">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0a] border-white/10 p-2 rounded-2xl min-w-[200px] shadow-2xl z-[120]">
               <DropdownMenuItem onClick={() => setIsNewContactOpen(true)} className="rounded-xl p-3 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary transition-colors cursor-pointer">
                  <Plus className="w-4 h-4" /> New Contact
               </DropdownMenuItem>
               <DropdownMenuItem onClick={handleMarkAllRead} className="rounded-xl p-3 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary transition-colors cursor-pointer">
                  <CheckCircle className="w-4 h-4" /> Mark all as read
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => router.push('/chat/archived')} className="rounded-xl p-3 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary transition-colors cursor-pointer">
                  <Archive className="w-4 h-4" /> Archived Chats
               </DropdownMenuItem>
               <DropdownMenuSeparator className="bg-white/5" />
               <DropdownMenuItem onClick={() => router.push('/chat/profile')} className="rounded-xl p-3 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary transition-colors cursor-pointer">
                  <UserCircle className="w-4 h-4" /> ME
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => router.push('/chat/settings')} className="rounded-xl p-3 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary transition-colors cursor-pointer">
                  <Settings className="w-4 h-4" /> Settings
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Network..." 
              className="bg-white/[0.03] border-white/5 focus:border-primary/50 pl-14 h-14 text-sm rounded-full focus-visible:ring-0 transition-all placeholder:text-muted-foreground/30 font-medium"
            />
          </div>

          <Button 
            variant="ghost" 
            onClick={() => router.push('/chat/archived')}
            className="w-full h-10 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-between px-4 group"
          >
            <div className="flex items-center gap-2">
              <Archive className="w-3 h-3 group-hover:scale-110 transition-transform" />
              <span>Archived Vault</span>
            </div>
            <ChevronRight className="w-3 h-3 opacity-30" />
          </Button>
        </div>
      </header>

      {/* Mobile Selection Tool Overlay */}
      <AnimatePresence>
        {isSelectionMode && isMobile && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-24 bg-black/90 backdrop-blur-3xl border-b border-primary/20 flex items-center justify-between px-6 z-[100] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" onClick={() => { setIsSelectionMode(false); setSelectedConvId(null); }} className="rounded-full bg-white/5">
                 <X className="w-5 h-5 text-white" />
               </Button>
               <span className="text-sm font-black font-headline uppercase tracking-widest text-primary italic">Selection</span>
            </div>
            <div className="flex items-center gap-2">
               <Button 
                  onClick={() => {
                    const conv = filteredConversations.find(c => c.id === selectedConvId);
                    if (conv) togglePin(conv.id, !!conv.pinnedBy?.includes(user?.uid || ''));
                  }}
                  className="rounded-xl bg-white/5 h-12 w-12 hover:bg-primary/20 text-primary"
                >
                  {filteredConversations.find(c => c.id === selectedConvId)?.pinnedBy?.includes(user?.uid || '') ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
               </Button>
               <Button 
                  onClick={() => { if (selectedConvId) archiveChat(selectedConvId); setSelectedConvId(null); setIsSelectionMode(false); }}
                  className="rounded-xl bg-white/5 h-12 w-12 hover:bg-primary/20 text-primary"
                >
                  <Archive className="w-5 h-5" />
               </Button>
               <Button 
                  onClick={() => setManageChatId(selectedConvId)}
                  className="rounded-xl bg-white/5 h-12 w-12 hover:bg-destructive/20 text-destructive"
                >
                  <Trash2 className="w-5 h-5" />
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollArea className="flex-1 w-full pt-4">
        <div className="px-3 pb-32 space-y-2">
          {filteredConversations.map((conv) => {
            const otherId = conv.participantIds.find(id => id !== user?.uid);
            const profile = otherId ? chatProfiles[otherId] : null;
            if (!profile) return null;

            const isPinned = conv.pinnedBy?.includes(user?.uid || '');
            const displayName = contactAliasMap[otherId || '']?.customName || profile.displayName || profile.fullName || 'User';
            const unreadCount = conv.unreadCount?.[user?.uid || ''] || 0;
            const statusInfo = otherId ? statusMap[otherId] : undefined;
            const isSelected = selectedConvId === conv.id || pathname === `/chat/${conv.id}`;

            return (
              <div 
                key={conv.id}
                className="relative group/item w-full"
                onPointerDown={() => handlePointerDown(conv.id)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => handleChatClick(conv.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChatClick(conv.id); } }}
                  className={cn(
                    "w-full p-4 rounded-[2rem] flex items-center gap-4 transition-all border border-transparent overflow-hidden relative cursor-pointer outline-none",
                    isSelected 
                      ? "bg-primary/10 border-primary/20 shadow-[inset_0_0_20px_rgba(0,200,83,0.05)]" 
                      : "hover:bg-white/5"
                  )}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full glow-green" />
                  )}

                  <div className="relative shrink-0 flex-none flex items-center justify-center w-14 h-14">
                    {statusInfo && statusInfo.count > 0 && (
                      <SegmentedRing count={statusInfo.count} hasUnseen={statusInfo.hasUnseen} size={56} />
                    )}
                    <div className="w-12 h-12 rounded-full border border-white/10 bg-[#111] flex items-center justify-center overflow-hidden z-0 group-hover/item:scale-105 transition-transform duration-500">
                      <div className="text-xl font-bold text-primary flex items-center justify-center w-full h-full leading-none translate-y-[1px]">{displayName.charAt(0).toUpperCase()}</div>
                    </div>
                    {profile.showOnlineStatus !== false && profile.isOnline && (
                      <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-primary rounded-full border-2 border-[#0d0d0d] glow-green z-20 shadow-lg" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={cn(
                        "font-bold text-sm text-white truncate min-w-0 flex-1 font-headline uppercase tracking-tight",
                        isPinned && "flex items-center gap-1.5"
                      )}>
                        {isPinned && <Pin className="w-3 h-3 text-primary fill-primary" />}
                        {displayName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter whitespace-nowrap opacity-60">
                          {conv.updatedAt?.toDate ? formatShortTime(conv.updatedAt.toDate(), isMobile) : ''}
                        </span>
                        
                        {!isMobile && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); }} 
                                className="h-6 w-6 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity bg-white/5 hover:bg-white/10"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#111] border-white/10 min-w-[180px] rounded-2xl p-2 shadow-2xl z-[110]">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(conv.id, isPinned); }} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/10 text-white text-[9px] font-black uppercase tracking-widest">
                                {isPinned ? <><PinOff className="w-4 h-4" /> Unpin</> : <><Pin className="w-4 h-4" /> Pin</>}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); archiveChat(conv.id); }} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/10 text-white text-[9px] font-black uppercase tracking-widest">
                                <Archive className="w-4 h-4" /> Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); otherId && setViewingProfile(chatProfiles[otherId]); }} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/10 text-white text-[9px] font-black uppercase tracking-widest">
                                <User className="w-4 h-4" /> Contact
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setManageChatId(conv.id); }} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-destructive/10 text-destructive text-[9px] font-black uppercase tracking-widest">
                                <Trash2 className="w-4 h-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 overflow-hidden">
                      <p className={cn(
                        "text-[11px] min-w-0 flex-1 truncate font-medium",
                        unreadCount > 0 ? "text-white/90" : "text-muted-foreground/50"
                      )}>
                        {conv.lastMessage || 'Secure connection active...'}
                      </p>
                      {unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-black rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center glow-green">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="py-32 text-center space-y-6 opacity-30 px-6">
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-dashed border-white/20">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">No signals found</p>
                 <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Adjust your search parameters</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!manageChatId} onOpenChange={() => setManageChatId(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/5 text-white p-0 rounded-[2.5rem] overflow-hidden max-w-sm shadow-2xl">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight text-gradient text-center">Manage Chat</DialogTitle>
            <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Choose an action for this conversation shard
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-8 flex flex-col gap-3">
            <Button 
              onClick={() => manageChatId && handleClearChat(manageChatId)}
              className="h-14 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Clear Message History
            </Button>
            <Button 
              onClick={() => manageChatId && handleDeleteChat(manageChatId)}
              variant="destructive" 
              className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest glow-green shadow-xl active:scale-95 transition-all"
            >
              Delete & Hide Chat
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setManageChatId(null)}
              className="h-10 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white"
            >
              Cancel Protocol
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/5 text-white p-0 rounded-[2.5rem] overflow-hidden max-w-md shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight text-gradient">User Profile</DialogTitle>
          </DialogHeader>
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center bg-[#111] overflow-hidden">
                <span className="text-4xl font-black text-primary uppercase">{(viewingProfile?.fullName || 'U').charAt(0)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black font-headline tracking-tighter uppercase">{viewingProfile?.fullName}</h2>
              <p className="text-primary text-[10px] font-bold uppercase tracking-widest">@{viewingProfile?.username}</p>
            </div>
            <div className="w-full bg-white/5 rounded-2xl p-6 border border-white/5 text-left space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">About</span>
                <p className="text-sm">{viewingProfile?.about || "Secure HappyChat User"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact</span>
                <p className="text-sm text-primary">{viewingProfile?.email}</p>
              </div>
            </div>
            <Button 
              onClick={() => { if (viewingProfile) router.push(`/chat/new-${viewingProfile.id}`); setViewingProfile(null); }}
              className="w-full h-14 bg-primary hover:glow-green text-primary-foreground font-black uppercase text-xs tracking-widest rounded-xl"
            >
              Message Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewContactOpen} onOpenChange={setIsNewContactOpen}>
        <AddContactDialogContent onSuccess={() => setIsNewContactOpen(false)} currentUserId={user?.uid} />
      </Dialog>
    </div>
  );
}

