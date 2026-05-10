
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MoreVertical, Pin, Trash2, User, ChevronRight, X, PinOff, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, where, doc, updateDoc, onSnapshot, limit, orderBy, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
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
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    return `${diffDay}d`;
  } else {
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''}`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''}`;
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''}`;
    return format(date, 'dd/MM/yy');
  }
}

function SegmentedRing({ count, hasUnseen, size = 56 }: { count: number, hasUnseen: boolean, size?: number }) {
  if (count === 0) return null;
  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;
  const gap = count > 1 ? 4 : 0;
  const segmentLength = (circumference - (gap * count)) / count;
  const color = hasUnseen ? "hsl(var(--primary))" : "rgba(255, 255, 255, 0.2)";

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
          strokeWidth="2.5"
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
  
  // Selection State
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  // Management State
  const [manageChatId, setManageChatId] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);

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

  // Active Statuses
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
    
    // Filter out hidden conversations
    const filtered = rawConversations.filter(c => !c.hiddenFor?.includes(user.uid));

    return [...filtered].sort((a, b) => {
      const isPinnedA = a.pinnedBy?.includes(user.uid) ? 1 : 0;
      const isPinnedB = b.pinnedBy?.includes(user.uid) ? 1 : 0;

      if (isPinnedA !== isPinnedB) {
        return isPinnedB - isPinnedA;
      }

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

  // Actions
  const togglePin = async (convId: string, isCurrentlyPinned: boolean) => {
    if (!user || !db) return;
    const convRef = doc(db, 'conversations', convId);
    try {
      await updateDoc(convRef, {
        pinnedBy: isCurrentlyPinned ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      toast({ title: isCurrentlyPinned ? "Unpinned" : "Pinned", description: "Chat list updated." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to update pin status." });
    }
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
      await batch.commit();
      toast({ title: "Chat Cleared", description: "All messages removed for you." });
      setManageChatId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to clear history." });
    }
  };

  const handleDeleteChat = async (convId: string) => {
    if (!user || !db) return;
    const convRef = doc(db, 'conversations', convId);
    try {
      await updateDoc(convRef, {
        hiddenFor: arrayUnion(user.uid)
      });
      toast({ title: "Chat Deleted", description: "Conversation removed from your recents." });
      setIsSelectionMode(false);
      setSelectedConvId(null);
      setManageChatId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to delete chat." });
    }
  };

  const handleOpenProfile = (otherId: string) => {
    const profile = chatProfiles[otherId];
    if (profile) {
      setViewingProfile(profile);
    }
  };

  // Interaction Handlers
  const handlePointerDown = (id: string) => {
    if (!isMobile) return;
    holdTimer.current = setTimeout(() => {
      setSelectedConvId(id);
      setIsSelectionMode(true);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 700);
  };

  const handlePointerUp = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const handleChatClick = (id: string) => {
    if (isSelectionMode) {
      setSelectedConvId(id === selectedConvId ? null : id);
      if (id === selectedConvId) setIsSelectionMode(false);
      return;
    }
    router.push(`/chat/${id}`);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] w-full overflow-hidden border-r border-white/5">
      <header className="flex-none p-4 md:p-6 space-y-6">
        <div className="h-10 relative">
          <AnimatePresence mode="wait">
            {isSelectionMode && isMobile ? (
              <motion.div 
                key="selection-tools"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-between bg-primary/20 backdrop-blur-3xl border border-primary/20 rounded-2xl px-4 z-50"
              >
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => { setIsSelectionMode(false); setSelectedConvId(null); }} className="h-8 w-8 text-primary hover:bg-primary/20">
                    <X className="w-4 h-4" />
                  </Button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary italic font-headline">Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      const conv = filteredConversations.find(c => c.id === selectedConvId);
                      if (conv) togglePin(conv.id, !!conv.pinnedBy?.includes(user?.uid || ''));
                    }}
                    className="h-8 w-8 text-primary hover:bg-primary/20"
                  >
                    {filteredConversations.find(c => c.id === selectedConvId)?.pinnedBy?.includes(user?.uid || '') ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      if (selectedConvId) {
                        setIsSelectionMode(false);
                        setSelectedConvId(null);
                        router.push(`/chat/${selectedConvId}?info=true`);
                      }
                    }}
                    className="h-8 w-8 text-primary hover:bg-primary/20"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => selectedConvId && setManageChatId(selectedConvId)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="normal-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between"
              >
                <h2 className="text-xl md:text-2xl font-bold font-headline text-white tracking-tighter uppercase">Chats</h2>
                <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-muted-foreground">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
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
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="px-3 pb-24 md:pb-6 space-y-1">
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
                className="relative group/item"
                onPointerDown={() => handlePointerDown(conv.id)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => handleChatClick(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleChatClick(conv.id);
                    }
                  }}
                  className={cn(
                    "w-full p-4 rounded-3xl flex items-center gap-4 transition-all border border-transparent overflow-hidden relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]",
                    isSelected 
                      ? (isSelectionMode ? "bg-primary/20 border-primary/40 shadow-xl" : "bg-primary/10 border-primary/20 shadow-md") 
                      : "hover:bg-white/5"
                  )}
                >
                  <div className="relative shrink-0 flex-none flex items-center justify-center w-14 h-14">
                    {statusInfo && statusInfo.count > 0 && (
                      <SegmentedRing count={statusInfo.count} hasUnseen={statusInfo.hasUnseen} size={56} />
                    )}
                    <div className="w-12 h-12 rounded-full border border-white/10 bg-[#111] flex items-center justify-center overflow-hidden z-0">
                      <div className="text-xl font-bold text-primary">{displayName.charAt(0).toUpperCase()}</div>
                    </div>
                    {profile.showOnlineStatus !== false && profile.isOnline && (
                      <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-[#0d0d0d] glow-green z-20" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col min-w-0 text-left pr-4">
                    <div className="flex items-center justify-between gap-2 min-w-0 w-full mb-1">
                      <span className={cn(
                        "font-bold text-sm text-white truncate min-w-0 flex-1",
                        isPinned && "flex items-center gap-1.5"
                      )}>
                        {isPinned && <Pin className="w-3 h-3 text-primary fill-primary" />}
                        {displayName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                          {conv.updatedAt?.toDate ? formatShortTime(conv.updatedAt.toDate(), isMobile) : ''}
                        </span>
                        
                        {/* PC Hover Dots */}
                        {!isMobile && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                }} 
                                className="h-6 w-6 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity bg-white/5 hover:bg-white/10"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#0d0d0d] border-white/10 min-w-[180px] rounded-2xl p-2 shadow-2xl z-[100]">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(conv.id, isPinned); }} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/10 text-white text-[10px] font-bold uppercase tracking-widest">
                                {isPinned ? <><PinOff className="w-4 h-4" /> Unpin Chat</> : <><Pin className="w-4 h-4" /> Pin Chat</>}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); otherId && handleOpenProfile(otherId); }} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/10 text-white text-[10px] font-bold uppercase tracking-widest">
                                <User className="w-4 h-4" /> View Contact
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setManageChatId(conv.id); }} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest">
                                <Trash2 className="w-4 h-4" /> Delete Chat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 min-w-0 w-full overflow-hidden">
                      <p className={cn(
                        "text-[11px] min-w-0 flex-1 truncate",
                        unreadCount > 0 ? "text-white font-bold" : "text-muted-foreground"
                      )}>
                        {conv.lastMessage || 'Secure chat...'}
                      </p>
                      {unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
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
            <div className="py-32 text-center space-y-4 opacity-20">
              <Search className="w-12 h-12 mx-auto" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No matching chats</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Chat Management Confirmation Dialog */}
      <Dialog open={!!manageChatId} onOpenChange={() => setManageChatId(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/5 text-white p-0 rounded-[2.5rem] overflow-hidden max-w-sm shadow-2xl">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight text-gradient text-center">Manage Chat</DialogTitle>
            <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Choose an action for this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-8 flex flex-col gap-3">
            <Button 
              onClick={() => manageChatId && handleClearChat(manageChatId)}
              variant="secondary" 
              className="h-14 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Clear Chat History
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
              Cancel Action
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Info Dialog (Shared) */}
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
              onClick={() => {
                if (viewingProfile) router.push(`/chat/new-${viewingProfile.id}`);
                setViewingProfile(null);
              }}
              className="w-full h-14 bg-primary hover:glow-green text-primary-foreground font-black uppercase text-xs tracking-widest rounded-xl"
            >
              Message Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
