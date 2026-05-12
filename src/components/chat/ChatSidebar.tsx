
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, MoreVertical, Pin, Trash2, User, ChevronRight, X, 
  PinOff, Info, ArrowLeft, MessageCircle, Archive, CheckCircle, 
  UserCircle, Settings, Plus
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  typing?: Record<string, boolean>;
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

  if (diffSec < 60) return 'NOW';

  if (isMobile) {
    if (diffMin < 60) return `${diffMin}M`;
    if (diffHour < 24) return `${diffHour}H`;
    return `${diffDay}D`;
  } else {
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return format(date, 'dd/MM');
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

  // SECURE QUERY
  const convQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
  }, [db, user?.uid]);

  const { data: rawConversations } = useCollection<Conversation>(convQuery);

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'users', user.uid, 'contacts'));
  }, [db, user?.uid]);

  const { data: userContacts } = useCollection<ContactRecord>(contactsQuery);

  const statusQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'statuses'),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt', 'desc')
    );
  }, [db, user?.uid]);
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
    if (!rawConversations || !db || !user?.uid) {
      setChatProfiles({});
      return;
    }
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
  }, [rawConversations, db, user?.uid]);

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
    const q = searchQuery.toLowerCase();
    return sortedConversations.filter(conv => {
      const otherId = conv.participantIds.find(id => id !== user?.uid);
      const profile = otherId ? chatProfiles[otherId] : null;
      const contact = otherId ? contactAliasMap[otherId] : null;
      const name = contact?.customName || profile?.displayName || profile?.fullName || '';
      return (
        name.toLowerCase().includes(q) ||
        profile?.username.toLowerCase().includes(q) ||
        conv.lastMessage?.toLowerCase().includes(q)
      );
    });
  }, [sortedConversations, searchQuery, chatProfiles, contactAliasMap, user]);

  const togglePin = async (convId: string, isCurrentlyPinned: boolean) => {
    if (!user || !db) return;
    const convRef = doc(db, 'conversations', convId);
    try {
      await updateDoc(convRef, { pinnedBy: isCurrentlyPinned ? arrayRemove(user.uid) : arrayUnion(user.uid) });
      toast({ title: isCurrentlyPinned ? "Unpinned" : "Pinned" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Pin operation failed." });
    }
  };

  const archiveChat = async (convId: string) => {
    if (!user || !db) return;
    const convRef = doc(db, 'conversations', convId);
    try {
      await updateDoc(convRef, { archivedBy: arrayUnion(user.uid) });
      toast({ title: "Archived" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Archiving failed." });
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
    toast({ title: "Inbox Cleared" });
  };

  const handleClearChat = async (convId: string) => {
    if (!user || !db) return;
    try {
      const q = query(collection(db, 'conversations', convId, 'messages'));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(docSnap => { 
        batch.update(docSnap.ref, { deletedFor: arrayUnion(user.uid) }); 
      });
      const convRef = doc(db, 'conversations', convId);
      batch.update(convRef, { lastMessage: "" });
      await batch.commit();
      toast({ title: "History Wiped" });
      setManageChatId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Clear failed." });
    }
  };

  const handleDeleteChat = async (convId: string) => {
    if (!user || !db) return;
    const convRef = doc(db, 'conversations', convId);
    try {
      await updateDoc(convRef, { hiddenFor: arrayUnion(user.uid) });
      toast({ title: "Chat Removed" });
      setIsSelectionMode(false);
      setSelectedConvId(null);
      setManageChatId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Removal failed." });
    }
  };

  const handleChatClick = (id: string) => {
    if (isSelectionMode) {
      if (id === selectedConvId) {
        setSelectedConvId(null);
        setIsSelectionMode(false);
      } else {
        setSelectedConvId(id);
      }
      return;
    }
    router.push(`/chat/${id}`);
  };

  const handlePointerDown = (id: string) => {
    if (!isMobile) return;
    holdTimer.current = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedConvId(id);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 600);
  };

  const handlePointerUp = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] w-full overflow-hidden border-r border-white/5 relative">
      <header className="flex-none p-4 md:p-6 pb-2 space-y-4 md:space-y-6">
        {/* TOP ROW: Title or Selection Bar */}
        <div className="h-12 flex items-center justify-between gap-2 overflow-hidden">
          <AnimatePresence mode="wait">
            {isSelectionMode && selectedConvId ? (
              <motion.div 
                key="selection-bar"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="w-full h-full bg-primary/10 rounded-2xl border border-primary/20 px-4 flex items-center justify-between backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setIsSelectionMode(false); setSelectedConvId(null); }} 
                    className="h-8 w-8 text-white hover:bg-white/5 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Mode: Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { 
                    const conv = sortedConversations.find(c => c.id === selectedConvId);
                    if (conv) togglePin(conv.id, conv.pinnedBy?.includes(user?.uid || '') || false);
                  }} className="h-8 w-8 text-white hover:text-primary">
                    <Pin className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => archiveChat(selectedConvId)} className="h-8 w-8 text-white hover:text-primary">
                    <Archive className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setManageChatId(selectedConvId)} className="h-8 w-8 text-destructive hover:bg-destructive/5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="normal-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between w-full"
              >
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] font-black tracking-widest uppercase mb-1">
                    <MessageCircle className="w-2 h-2" /> V2.6
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black font-headline text-white tracking-tighter uppercase italic truncate">Recents</h2>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-muted-foreground w-10 h-10 shrink-0">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 p-1.5 rounded-xl min-w-[180px] shadow-2xl z-[120]">
                    <DropdownMenuItem onClick={() => setIsNewContactOpen(true)} className="rounded-lg p-2.5 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary cursor-pointer">
                      <Plus className="w-4 h-4" /> New Contact
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMarkAllRead} className="rounded-lg p-2.5 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary cursor-pointer">
                      <CheckCircle className="w-4 h-4" /> Mark all read
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/chat/archived')} className="rounded-lg p-2.5 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary cursor-pointer">
                      <Archive className="w-4 h-4" /> Vault
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={() => router.push('/chat/profile')} className="rounded-lg p-2.5 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary cursor-pointer">
                      <UserCircle className="w-4 h-4" /> My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/chat/settings')} className="rounded-lg p-2.5 gap-3 uppercase font-bold text-[10px] tracking-widest text-white/80 hover:text-primary cursor-pointer">
                      <Settings className="w-4 h-4" /> Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SEARCH & ARCHIVE (Always Visible) */}
        <div className="space-y-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..." 
              className="bg-white/[0.03] border-white/5 focus:border-primary/30 pl-11 h-11 text-xs rounded-xl focus-visible:ring-0 transition-all placeholder:text-muted-foreground/30 font-medium"
            />
          </div>

          <Button 
            variant="ghost" 
            onClick={() => router.push('/chat/archived')}
            className="w-full h-9 rounded-lg bg-white/[0.02] border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-between px-3"
          >
            <div className="flex items-center gap-2">
              <Archive className="w-3 h-3" />
              <span>Archived Shards</span>
            </div>
            <ChevronRight className="w-3 h-3 opacity-30" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 w-full mt-2">
        <div className="px-2 pb-32 space-y-0.5">
          {filteredConversations.map((conv) => {
            const otherId = conv.participantIds.find(id => id !== user?.uid);
            const profile = otherId ? chatProfiles[otherId] : null;
            if (!profile) return null;

            const isPinned = conv.pinnedBy?.includes(user?.uid || '');
            const displayName = contactAliasMap[otherId || '']?.customName || profile.displayName || profile.fullName || 'User';
            const unreadCount = conv.unreadCount?.[user?.uid || ''] || 0;
            const statusInfo = otherId ? statusMap[otherId] : undefined;
            const isSelected = pathname === `/chat/${conv.id}`;
            const isInSelection = isSelectionMode && selectedConvId === conv.id;
            const isTyping = otherId ? conv.typing?.[otherId] === true : false;

            const rawLastMessage = conv.lastMessage || 'Secure link...';
            const displayLastMessage = rawLastMessage.length > 20 
              ? rawLastMessage.substring(0, 20) + '...' 
              : rawLastMessage;

            return (
              <div key={conv.id} className="w-full px-1">
                <div 
                  onClick={() => handleChatClick(conv.id)}
                  onPointerDown={() => handlePointerDown(conv.id)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className={cn(
                    "w-full p-3 rounded-2xl flex items-center gap-3 transition-all border border-transparent cursor-pointer group/item relative",
                    (isSelected || isInSelection) ? "bg-primary/10 border-primary/20 shadow-sm" : "hover:bg-white/[0.03]",
                    isInSelection && "ring-2 ring-primary/50"
                  )}
                >
                  <div className="relative shrink-0 flex items-center justify-center w-12 h-12">
                    {statusInfo && statusInfo.count > 0 && (
                      <SegmentedRing count={statusInfo.count} hasUnseen={statusInfo.hasUnseen} size={48} />
                    )}
                    <div className="w-10 h-10 rounded-full border border-white/10 bg-[#111] flex items-center justify-center overflow-hidden z-0">
                      <span className="text-sm font-bold text-primary not-italic flex items-center justify-center leading-none h-full w-full">{displayName.charAt(0).toUpperCase()}</span>
                    </div>
                    {profile.showOnlineStatus !== false && profile.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-[#0d0d0d] z-20 shadow-lg" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col min-w-0 text-left">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={cn(
                        "font-bold text-sm text-white truncate font-headline uppercase tracking-tight flex-1",
                        isPinned && "flex items-center gap-1.5"
                      )}>
                        {isPinned && <Pin className="w-3 h-3 text-primary fill-primary shrink-0" />}
                        {displayName}
                      </span>
                      <span className="text-[8px] font-black text-muted-foreground uppercase shrink-0">
                        {conv.updatedAt?.toDate ? formatShortTime(conv.updatedAt.toDate(), isMobile) : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      {isTyping ? (
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.1em] animate-pulse truncate">Typing...</p>
                      ) : (
                        <p className={cn(
                          "text-[10px] truncate flex-1 font-medium",
                          unreadCount > 0 ? "text-white/90" : "text-muted-foreground/50"
                        )}>
                          {displayLastMessage}
                        </p>
                      )}
                      {unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[8px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shrink-0">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                      {/* PC ONLY: Show 3-dots menu icon */}
                      {!isMobile && !isSelectionMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => e.stopPropagation()} 
                              className="h-5 w-5 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity bg-white/5 hover:bg-white/10 shrink-0"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#111] border-white/10 min-w-[160px] rounded-xl p-1.5 shadow-2xl z-[110]">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(conv.id, isPinned); }} className="gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-primary/10 text-white text-[9px] font-bold uppercase tracking-widest">
                              {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />} {isPinned ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); archiveChat(conv.id); }} className="gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-primary/10 text-white text-[9px] font-bold uppercase tracking-widest">
                              <Archive className="w-3 h-3" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setManageChatId(conv.id); }} className="gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-destructive/10 text-destructive text-[9px] font-bold uppercase tracking-widest">
                              <Trash2 className="w-3 h-3" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="py-24 text-center space-y-4 opacity-30 px-4">
              <MessageCircle className="w-8 h-8 mx-auto text-white/50" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">No conversations found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!manageChatId} onOpenChange={() => setManageChatId(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/5 text-white p-6 rounded-[2rem] max-w-xs shadow-2xl">
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold font-headline uppercase tracking-tight text-gradient">Manage Shard</h2>
            <div className="flex flex-col gap-2">
              <Button onClick={() => manageChatId && handleClearChat(manageChatId)} className="h-12 bg-white/5 border-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest">Clear History</Button>
              <Button onClick={() => manageChatId && handleDeleteChat(manageChatId)} variant="destructive" className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">Delete Chat</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewContactOpen} onOpenChange={setIsNewContactOpen}>
        <AddContactDialogContent onSuccess={() => setIsNewContactOpen(false)} currentUserId={user?.uid} />
      </Dialog>
    </div>
  );
}
