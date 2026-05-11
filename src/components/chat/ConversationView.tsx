'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, MoreHorizontal, Search, 
  MoreVertical, X, Info, ArrowLeft, Loader2,
  Check, Reply, CheckCheck, Trash2, BarChart2, UserPlus, MessageSquare,
  Forward, ChevronRight, Share2, Pencil, Plus, ArrowLeftCircle, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { 
  doc, query, collection, serverTimestamp, 
  getDocs, where, addDoc, updateDoc, increment, onSnapshot, writeBatch,
  arrayUnion, arrayRemove
} from 'firebase/firestore';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

type Message = {
  id: string;
  senderId: string;
  conversationId: string;
  text: string;
  createdAt: any;
  isEdited?: boolean;
  isDeleted?: boolean;
  deletedFor?: string[];
  status?: 'sent' | 'delivered' | 'read';
  updatedAt?: any;
  replyTo?: {
    id?: string;
    text: string;
    senderId?: string;
    senderName: string;
    isStatus?: boolean;
    statusUid?: string;
  };
  poll?: {
    question: string;
    options: string[];
    votes: Record<string, string[]>; 
  };
  sharedContact?: {
    uid: string;
    name: string;
    username: string;
  };
};

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  email: string;
  about?: string;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
};

type ContactRecord = {
  id: string;
  userId: string;
  customName?: string;
  addedAt?: any;
};

type Conversation = {
  id: string;
  participantIds: string[];
  typing?: Record<string, boolean>;
  hiddenFor?: string[];
};

export function ConversationView({ conversationId }: { conversationId: string }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [inputText, setInputText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState<'none' | 'menu' | 'poll' | 'contact'>('none');
  
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  const isNewChat = conversationId.startsWith('new-');
  const targetUid = isNewChat ? conversationId.replace('new-', '') : null;

  const convRef = useMemoFirebase(() => {
    if (!db || isNewChat) return null;
    return doc(db, 'conversations', conversationId);
  }, [db, conversationId, isNewChat]);
  
  const { data: conversation } = useDoc<Conversation>(convRef);

  const msgQuery = useMemoFirebase(() => {
    if (!db || isNewChat || !user) return null;
    return query(collection(db, 'conversations', conversationId, 'messages'));
  }, [db, conversationId, isNewChat, user]);
  
  const { data: rawMessages } = useCollection<Message>(msgQuery);

  const messages = useMemo(() => {
    if (!rawMessages || !user) return [];
    return [...rawMessages]
      .filter(m => !m.deletedFor?.includes(user.uid))
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
  }, [rawMessages, user]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => 
      m.text?.toLowerCase().includes(q) || 
      m.poll?.question.toLowerCase().includes(q) ||
      m.sharedContact?.name.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);
  const [contactRecord, setContactRecord] = useState<ContactRecord | null>(null);

  useEffect(() => {
    if (!user || !db || isNewChat || !conversationId) return;

    const setTyping = (isTyping: boolean) => {
      updateDoc(doc(db, 'conversations', conversationId), {
        [`typing.${user.uid}`]: isTyping
      }).catch(() => {});
    };

    if (inputText.length > 0) {
      setTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
    } else {
      setTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputText, user, db, conversationId, isNewChat]);

  useEffect(() => {
    if (searchParams.get('info') === 'true') {
      setShowProfile(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!db || isNewChat || !user || !rawMessages || isUserLoading) return;
    const unreadMessages = rawMessages.filter(m => m.senderId !== user.uid && m.status !== 'read');
    if (unreadMessages.length > 0) {
      const batch = writeBatch(db);
      unreadMessages.forEach(m => {
        const mRef = doc(db, 'conversations', conversationId, 'messages', m.id);
        batch.update(mRef, { status: 'read', updatedAt: serverTimestamp() });
      });
      batch.commit().catch(() => {});
    }
  }, [db, conversationId, isNewChat, user, rawMessages, isUserLoading]);

  useEffect(() => {
    const uid = targetUid || conversation?.participantIds.find(id => id !== user?.uid);
    if (!uid || !db || !user) return;
    onSnapshot(doc(db, 'users', uid), (snap) => snap.exists() && setOtherProfile(snap.data() as UserProfile));
    onSnapshot(doc(db, 'users', user.uid, 'contacts', uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ContactRecord;
        setContactRecord(data);
        setNewNickname(data.customName || '');
      } else {
        setContactRecord(null);
      }
    });
  }, [conversation, targetUid, user, db]);

  useEffect(() => {
    if (scrollRef.current && filteredMessages.length > 0) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const handleSendMessage = async (payloadOverride?: Partial<Message>) => {
    if ((!inputText.trim() && !payloadOverride) || !user || !db || !otherProfile || isUserLoading) return;
    const text = inputText;
    let replyData = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.text,
      senderId: replyingTo.senderId,
      senderName: replyingTo.senderId === user.uid ? 'You' : (contactRecord?.customName || otherProfile?.fullName || 'User')
    } : null;

    setInputText('');
    setReplyingTo(null);
    setActiveTool('none');

    let activeId = conversationId;
    let pIds = (conversation?.participantIds || [user.uid, otherProfile.id]).sort();

    if (isNewChat) {
      const existing = await getDocs(query(collection(db, 'conversations'), where('participantIds', '==', pIds)));
      if (existing.empty) {
        const newConv = await addDoc(collection(db, 'conversations'), {
          participantIds: pIds,
          updatedAt: serverTimestamp(),
          lastMessage: text || 'Media Shared',
          unreadCount: { [otherProfile.id]: 1, [user.uid]: 0 },
          hiddenFor: []
        });
        activeId = newConv.id;
        router.replace(`/chat/${activeId}`);
      } else {
        activeId = existing.docs[0].id;
        router.replace(`/chat/${activeId}`);
        await updateDoc(doc(db, 'conversations', activeId), {
          hiddenFor: arrayRemove(user.uid)
        });
      }
    } else {
      await updateDoc(doc(db, 'conversations', activeId), {
        hiddenFor: []
      });
    }

    const msg = {
      text: text || '',
      senderId: user.uid,
      conversationId: activeId,
      createdAt: serverTimestamp(),
      status: 'sent',
      replyTo: replyData,
      ...payloadOverride
    };

    addDoc(collection(db, 'conversations', activeId, 'messages'), msg).catch(() => {});

    updateDoc(doc(db, 'conversations', activeId), {
      lastMessage: text || 'Media Shared',
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherProfile.id}`]: increment(1),
      [`typing.${user.uid}`]: false
    }).catch(() => {});
  };

  const handleUpdateNickname = async () => {
    if (!user || !db || !otherProfile || isSavingNickname) return;
    setIsSavingNickname(true);
    try {
      const contactRef = doc(db, 'users', user.uid, 'contacts', otherProfile.id);
      await updateDoc(contactRef, {
        customName: newNickname.trim(),
        updatedAt: serverTimestamp()
      });
      setIsEditingNickname(false);
      toast({ title: "Name Updated", description: "The contact name has been saved." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Could not update name." });
    } finally {
      setIsSavingNickname(false);
    }
  };

  const deleteMessage = async (msgId: string, senderId: string, mode: 'me' | 'everyone') => {
    if (!user || !db) return;
    const ref = doc(db, 'conversations', conversationId, 'messages', msgId);
    if (mode === 'me') {
      updateDoc(ref, { deletedFor: arrayUnion(user.uid) });
    } else if (mode === 'everyone' && senderId === user.uid) {
      updateDoc(ref, { isDeleted: true, text: 'This message was deleted', poll: null, sharedContact: null });
    }
    setSelectedMessage(null);
    toast({ title: "Message Deleted" });
  };

  const isOtherTyping = useMemo(() => {
    if (!conversation?.typing || !otherProfile) return false;
    return conversation.typing[otherProfile.id] === true;
  }, [conversation?.typing, otherProfile]);

  const mainName = contactRecord?.customName || otherProfile?.displayName || otherProfile?.fullName || 'User';
  const initial = mainName.charAt(0).toUpperCase();

  return (
    <div className="flex-1 flex flex-col relative bg-[#050505] overflow-hidden">
      <header className="flex-none h-20 px-4 border-b border-white/5 flex items-center justify-between z-[60] sticky top-0 bg-black/80 backdrop-blur-3xl">
        <AnimatePresence mode="wait">
          {selectedMessage && isMobile ? (
            <motion.div 
              key="selection-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(null)} className="text-white">
                  <X className="w-6 h-6" />
                </Button>
                <span className="text-sm font-bold uppercase tracking-widest text-primary">Message Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setReplyingTo(selectedMessage); setSelectedMessage(null); }} className="text-white">
                  <Reply className="w-5 h-5" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0d0d0d] border-white/10 text-white rounded-[2rem]">
                    <div className="p-4 space-y-4">
                      <h2 className="text-lg font-headline uppercase tracking-tight text-center">Delete Message?</h2>
                      <div className="grid gap-2">
                        <Button onClick={() => deleteMessage(selectedMessage.id, selectedMessage.senderId, 'me')} variant="secondary" className="h-12 rounded-xl text-xs font-bold uppercase">Delete for Me</Button>
                        {selectedMessage.senderId === user?.uid && (
                          <Button onClick={() => deleteMessage(selectedMessage.id, selectedMessage.senderId, 'everyone')} variant="destructive" className="h-12 rounded-xl text-xs font-bold uppercase">Delete for Everyone</Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          ) : isSearchMode ? (
            <motion.div 
              key="search-header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-3 w-full"
            >
              <Button variant="ghost" size="icon" onClick={() => { setIsSearchMode(false); setSearchQuery(''); }} className="text-primary">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  placeholder="Search in conversation..."
                  className="bg-white/5 border-none h-11 pl-10 rounded-full focus-visible:ring-1 focus-visible:ring-primary/30"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="normal-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden text-muted-foreground"><ArrowLeft className="w-6 h-6" /></Button>
                <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={() => setShowProfile(true)}>
                  <div className="w-11 h-11 rounded-full border border-primary/20 bg-[#111] flex items-center justify-center overflow-hidden shrink-0">
                    <span className="text-base font-bold text-primary not-italic">{initial}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-base font-bold text-white truncate">{mainName}</h3>
                    {isOtherTyping ? (
                      <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] animate-pulse">Typing...</p>
                    ) : (
                      <p className={cn(
                        "text-[10px] uppercase font-bold tracking-widest",
                        otherProfile?.isOnline ? "text-primary" : "text-muted-foreground"
                      )}>
                        {otherProfile?.isOnline ? 'Online' : 'Offline'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setIsSearchMode(true)} className="text-muted-foreground hover:text-primary"><Search className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)} className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <ScrollArea className="flex-1 p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4 pb-12">
          {filteredMessages.map((msg) => (
            <MessageRow 
              key={msg.id} msg={msg} user={user} isMobile={isMobile}
              onVote={(idx: number) => handleVote(msg, idx)}
              onDelete={(mode: 'me' | 'everyone') => deleteMessage(msg.id, msg.senderId, mode)}
              onReply={() => setReplyingTo(msg)}
              onSelect={() => setSelectedMessage(msg)}
              isSelected={selectedMessage?.id === msg.id}
              otherProfile={otherProfile}
              contactRecord={contactRecord}
              highlight={searchQuery}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <AnimatePresence>
        {showProfile && otherProfile && (
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute inset-y-0 right-0 w-full md:w-96 bg-[#0a0a0a] border-l border-white/5 z-[100] flex flex-col shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">User Profile</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowProfile(false)} className="h-10 w-10 rounded-full"><X className="w-6 h-6" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center text-center space-y-8">
              <div className="w-32 h-32 rounded-full border-4 border-primary/20 bg-[#111] flex items-center justify-center overflow-hidden">
                <span className="text-5xl font-black text-primary uppercase not-italic">{initial}</span>
              </div>
              
              <div className="w-full space-y-4">
                {isEditingNickname ? (
                  <div className="space-y-4">
                    <Input 
                      value={newNickname} 
                      onChange={(e) => setNewNickname(e.target.value)}
                      placeholder="Enter a new name..."
                      className="bg-white/5 border-white/10 text-center text-lg font-bold h-14 rounded-xl"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateNickname} disabled={isSavingNickname} className="flex-1 h-12 bg-primary hover:glow-green text-primary-foreground font-bold uppercase text-xs tracking-widest rounded-xl">
                        {isSavingNickname ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Name'}
                      </Button>
                      <Button variant="ghost" onClick={() => setIsEditingNickname(false)} className="flex-1 h-12 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-3xl font-black font-headline tracking-tighter uppercase">{mainName}</h2>
                      <p className="text-primary text-[10px] font-bold uppercase tracking-widest">@{otherProfile.username}</p>
                    </div>
                    {contactRecord && (
                      <Button 
                        onClick={() => setIsEditingNickname(true)}
                        className="w-full h-12 bg-white/5 border border-white/10 text-white font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-white/10 transition-all"
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Edit Name
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="w-full bg-white/5 rounded-2xl p-6 border border-white/5 text-left space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                    <Info className="w-3 h-3" /> About
                  </span>
                  <p className="text-sm leading-relaxed">{otherProfile.about || "This user prefers to keep their bio private."}</p>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                    <MessageSquare className="w-3 h-3" /> Email Address
                  </span>
                  <p className="text-sm text-primary truncate">{otherProfile.email}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <footer className="bg-[#0a0a0a] border-t border-white/5 p-4 sticky bottom-0 z-50">
        <AnimatePresence>
          {replyingTo && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 py-3 bg-white/5 border-l-2 border-primary mb-3 flex justify-between items-center rounded-r-xl overflow-hidden shadow-lg">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-primary uppercase">Replying to {replyingTo.senderId === user?.uid ? 'You' : (contactRecord?.customName || otherProfile?.fullName || 'User')}</p>
                <p className="text-sm text-muted-foreground truncate">{replyingTo.text}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-8 w-8 shrink-0"><X className="w-5 h-5" /></Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setActiveTool(activeTool === 'none' ? 'menu' : 'none')}
            className={cn(
              "rounded-xl h-12 w-12 transition-all shrink-0",
              activeTool !== 'none' ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"
            )}
          >
            {activeTool === 'none' ? <Plus className="w-6 h-6" /> : <X className="w-6 h-6" />}
          </Button>

          <div className="flex-1 relative">
            <Input 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="Type your message..." 
              className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary focus-visible:ring-offset-0 text-sm" 
            />
          </div>
          <Button onClick={() => handleSendMessage()} disabled={!inputText.trim()} className="bg-primary hover:glow-green text-primary-foreground h-12 w-12 rounded-xl active:scale-95 transition-all shrink-0"><Send className="w-5 h-5" /></Button>
        </div>
      </footer>
    </div>
  );
}

function MessageRow({ msg, user, isMobile, onVote, onDelete, onReply, onSelect, isSelected, otherProfile, contactRecord, highlight }: any) {
  const isOwn = msg.senderId === user?.uid;
  const isSystem = msg.isDeleted;
  const router = useRouter();
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const x = useMotionValue(0);
  const swipeThreshold = 60;
  const replyIconOpacity = useTransform(x, [0, swipeThreshold], [0, 1]);

  const handlePointerDown = () => {
    if (!isMobile) return;
    holdTimerRef.current = setTimeout(() => {
      onSelect();
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 700); 
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const renderText = (text: string) => {
    if (!highlight || !highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <span key={i} className="bg-primary/40 text-white rounded-sm px-0.5 glow-green">{part}</span> 
        : part
    );
  };

  return (
    <div className={cn("flex w-full group relative", isOwn ? "justify-end" : "justify-start")}>
      <motion.div
        drag={isOwn || isSystem ? false : "x"}
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.1}
        onDragEnd={(event, info) => {
          if (info.offset.x > swipeThreshold) {
            onReply();
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={cn(
          "max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm relative transition-all duration-300",
          isSelected && "scale-[1.02] ring-2 ring-primary ring-offset-2 ring-offset-[#050505]",
          isSystem ? "bg-white/5 text-muted-foreground italic text-center px-8" : 
          isOwn ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg" : "bg-[#161616] text-white rounded-tl-none border border-white/5 shadow-md"
        )}
      >
        {msg.replyTo && (
          <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-primary text-[11px] opacity-80 truncate">
            <p className="font-bold text-primary mb-0.5">{msg.replyTo.senderName}</p>
            {msg.replyTo.text}
          </div>
        )}

        {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{renderText(msg.text)}</p>}

        <div className="flex justify-end gap-1 items-center mt-2 text-[10px] font-black uppercase opacity-60">
          <span>{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : ''}</span>
          {isOwn && !isSystem && (
            <div className="flex items-center ml-1">
              {msg.status === 'read' ? (
                <CheckCheck className="w-4 h-4 text-white stroke-[3.5]" />
              ) : msg.status === 'delivered' ? (
                <CheckCheck className="w-4 h-4 text-white/50 stroke-[3.5]" />
              ) : (
                <Check className="w-4 h-4 text-white/30 stroke-[3.5]" />
              )}
            </div>
          )}
        </div>

        {!isSystem && !isMobile && (
          <div className={cn(
            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10",
            isOwn ? "-left-12" : "-right-12"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/50 text-white hover:bg-primary transition-colors"><MoreVertical className="w-5 h-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#111] border-white/10 text-white min-w-[160px] rounded-xl shadow-2xl z-[100]">
                <DropdownMenuItem onClick={onReply} className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary p-3 text-[10px] uppercase font-bold tracking-widest">
                  <Reply className="w-3 h-3" /> Reply
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer focus:bg-destructive/10 focus:text-destructive p-3 text-[10px] uppercase font-bold tracking-widest text-destructive">
                      <Trash2 className="w-3 h-3" /> Delete
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0d0d0d] border-white/10 text-white rounded-[2rem] p-8">
                    <div className="space-y-6">
                      <h2 className="text-xl font-headline uppercase tracking-tight text-center">Erase Content?</h2>
                      <div className="grid gap-3">
                        <Button onClick={() => onDelete('me')} variant="secondary" className="h-14 rounded-xl text-xs font-bold uppercase tracking-widest">Delete for Me</Button>
                        {isOwn && (
                          <Button onClick={() => onDelete('everyone')} variant="destructive" className="h-14 rounded-xl text-xs font-bold uppercase tracking-widest">Delete for Everyone</Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function PollComposerInline({ onCreated }: { onCreated: (poll: any) => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleAddOption = () => setOptions([...options, '']);
  
  const handleOptionChange = (idx: number, val: string) => {
    const newOptions = [...options];
    newOptions[idx] = val;
    setOptions(newOptions);
  };

  const isInvalid = !question.trim() || options.some(o => !o.trim());

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Question</Label>
        <Input 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)} 
          placeholder="What's the topic?" 
          className="bg-white/5 border-white/5 h-12 text-sm focus:ring-primary focus-visible:ring-offset-0 rounded-xl" 
        />
      </div>
      <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
        {options.map((opt, i) => (
          <Input 
            key={i} 
            value={opt} 
            onChange={(e) => handleOptionChange(i, e.target.value)} 
            placeholder={`Option ${i+1}`} 
            className="bg-white/5 border-white/5 h-11 text-sm focus:ring-primary focus-visible:ring-offset-0 rounded-xl" 
          />
        ))}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleAddOption} 
          className="w-full text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:bg-primary/10 rounded-xl h-10"
        >
          Add Option +
        </Button>
      </div>
      <Button 
        onClick={() => onCreated({ question, options, votes: {} })} 
        disabled={isInvalid} 
        className="w-full h-12 bg-primary hover:glow-green uppercase font-black text-[11px] tracking-widest text-primary-foreground rounded-xl transition-all"
      >
        Create Poll
      </Button>
    </div>
  );
}

function ContactPickerInline({ onPicked, currentUserId }: any) {
  const db = useFirestore();
  const contactsQuery = useMemoFirebase(() => currentUserId && db ? query(collection(db, 'users', currentUserId, 'contacts')) : null, [db, currentUserId]);
  const { data: contacts, isLoading } = useCollection<ContactRecord>(contactsQuery);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!contacts || !db) return;
    const fetchAll = async () => {
      const results: UserProfile[] = [];
      for (const c of contacts) {
        const snap = await getDocs(query(collection(db, 'users'), where('id', '==', c.userId)));
        if (!snap.empty) results.push(snap.docs[0].data() as UserProfile);
      }
      setProfiles(results);
    };
    fetchAll();
  }, [contacts, db]);

  const filtered = profiles.filter(p => 
    p.fullName?.toLowerCase().includes(search.toLowerCase()) || 
    p.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your contacts..." 
          className="bg-white/5 border-white/10 h-12 text-sm rounded-xl focus:ring-primary"
        />
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-1">
          {filtered.map(p => (
            <button 
              key={p.id} 
              onClick={() => onPicked({ uid: p.id, name: p.fullName || p.displayName, username: p.username })} 
              className="w-full p-3 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm uppercase not-italic">
                {(p.fullName || p.displayName || 'U').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white truncate">{p.fullName || p.displayName}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">@{p.username}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
            </button>
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="py-12 text-center opacity-30">
              <p className="text-xs font-bold uppercase tracking-widest">No matching contacts</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
