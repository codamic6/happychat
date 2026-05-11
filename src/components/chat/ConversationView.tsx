'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, MoreHorizontal, Smile, Search, 
  MoreVertical, X, Info, ArrowLeft, Loader2,
  Check, Reply, CheckCheck, Trash2, BarChart2, UserPlus, MessageSquare,
  Forward, ChevronRight, Share2, Pencil, Plus, ArrowLeftCircle
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
  DialogTrigger,
  DialogFooter
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

  // Selection & Tools State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Action Tray State
  const [activeTool, setActiveTool] = useState<'none' | 'menu' | 'poll' | 'contact'>('none');
  
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

  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);
  const [contactRecord, setContactRecord] = useState<ContactRecord | null>(null);

  // Typing Logic
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
    onSnapshot(doc(db, 'users', user.uid, 'contacts', uid), (snap) => snap.exists() ? setContactRecord(snap.data() as ContactRecord) : setContactRecord(null));
  }, [conversation, targetUid, user, db]);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    updateDoc(doc(db, 'conversations', activeId, {
      lastMessage: text || 'Media Shared',
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherProfile.id}`]: increment(1),
      [`typing.${user.uid}`]: false
    })).catch(() => {});
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
    toast({ title: "Message Deleted", description: mode === 'me' ? "Removed from your view." : "Removed for everyone." });
  };

  const handleVote = async (msg: Message, optionIndex: number) => {
    if (!user || !db) return;
    const votes = msg.poll?.votes || {};
    const currentVotes = votes[optionIndex] || [];
    if (currentVotes.includes(user.uid)) return;

    const newVotes = { ...votes };
    Object.keys(newVotes).forEach(idx => {
      newVotes[idx] = (newVotes[idx] || []).filter(uid => uid !== user.uid);
    });
    newVotes[optionIndex] = [...(newVotes[optionIndex] || []), user.uid];

    updateDoc(doc(db, 'conversations', conversationId, 'messages', msg.id), { 'poll.votes': newVotes });
  };

  const isOtherTyping = useMemo(() => {
    if (!conversation?.typing || !otherProfile) return false;
    return conversation.typing[otherProfile.id] === true;
  }, [conversation?.typing, otherProfile]);

  const mainName = contactRecord?.customName || otherProfile?.displayName || otherProfile?.fullName || 'User';
  const initial = mainName.charAt(0).toUpperCase();

  return (
    <div className="flex-1 flex flex-col relative bg-[#050505] overflow-hidden">
      <header className="flex-none h-16 px-4 border-b border-white/5 flex items-center justify-between z-[60] sticky top-0 bg-black/80 backdrop-blur-3xl">
        <AnimatePresence mode="wait">
          {selectedMessage && isMobile ? (
            <motion.div 
              key="selection-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(null)} className="text-white">
                  <X className="w-6 h-6" />
                </Button>
                <span className="text-sm font-bold uppercase tracking-widest text-primary">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setReplyingTo(selectedMessage); setSelectedMessage(null); }} className="text-white">
                  <Reply className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white">
                  <Forward className="w-5 h-5" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0d0d0d] border-white/10 text-white rounded-[2rem]">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-headline uppercase tracking-tight">Delete Message?</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-4">
                      <Button onClick={() => deleteMessage(selectedMessage.id, selectedMessage.senderId, 'me')} variant="secondary" className="h-12 rounded-xl text-xs font-bold uppercase">Delete for Me</Button>
                      {selectedMessage.senderId === user?.uid && (
                        <Button onClick={() => deleteMessage(selectedMessage.id, selectedMessage.senderId, 'everyone')} variant="destructive" className="h-12 rounded-xl text-xs font-bold uppercase">Delete for Everyone</Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
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
                  <div className="w-10 h-10 rounded-full border border-primary/20 bg-[#111] flex items-center justify-center overflow-hidden shrink-0">
                    <span className="text-sm font-bold text-primary">{initial}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{mainName}</h3>
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
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Search className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)} className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <ScrollArea className="flex-1 p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4 pb-12">
          {messages.map((msg) => (
            <MessageRow 
              key={msg.id} msg={msg} user={user} isMobile={isMobile}
              onVote={(idx: number) => handleVote(msg, idx)}
              onDelete={(mode: 'me' | 'everyone') => deleteMessage(msg.id, msg.senderId, mode)}
              onReply={() => setReplyingTo(msg)}
              onSelect={() => setSelectedMessage(msg)}
              isSelected={selectedMessage?.id === msg.id}
              otherProfile={otherProfile}
              contactRecord={contactRecord}
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
            className="absolute inset-y-0 right-0 w-full md:w-80 bg-[#0a0a0a] border-l border-white/5 z-[100] flex flex-col shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">User Details</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowProfile(false)} className="h-8 w-8 rounded-full"><X className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-32 h-32 rounded-full border-4 border-primary/20 bg-[#111] flex items-center justify-center overflow-hidden">
                <span className="text-4xl font-black text-primary uppercase">{initial}</span>
              </div>
              <div>
                <h2 className="text-2xl font-black font-headline tracking-tighter uppercase">{mainName}</h2>
                <p className="text-primary text-[10px] font-bold uppercase tracking-widest">@{otherProfile.username}</p>
              </div>
              <div className="w-full bg-white/5 rounded-2xl p-6 border border-white/5 text-left space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">About</span>
                  <p className="text-sm">{otherProfile.about || "Secure HappyChat User"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</span>
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
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 py-2 bg-white/5 border-l-2 border-primary mb-2 flex justify-between items-center rounded-r-xl overflow-hidden">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-primary uppercase">Replying to {replyingTo.senderId === user?.uid ? 'You' : (otherProfile?.fullName || 'User')}</p>
                <p className="text-xs text-muted-foreground truncate">{replyingTo.text}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-6 w-6 shrink-0"><X className="w-4 h-4" /></Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTool !== 'none' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#0d0d0d] border border-white/5 rounded-2xl mb-4 overflow-hidden shadow-2xl"
            >
              <div className="p-4">
                {activeTool === 'menu' && (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setActiveTool('poll')}
                      className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/5 hover:bg-primary/10 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <BarChart2 className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Create Poll</span>
                    </button>
                    <button 
                      onClick={() => setActiveTool('contact')}
                      className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/5 hover:bg-primary/10 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Share Contact</span>
                    </button>
                  </div>
                )}

                {activeTool === 'poll' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setActiveTool('menu')} className="h-8 w-8 text-primary">
                          <ArrowLeftCircle className="w-5 h-5" />
                        </Button>
                        <span className="text-xs font-bold uppercase tracking-widest">New Poll</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setActiveTool('none')} className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <PollComposerInline onCreated={(p) => handleSendMessage({ poll: p })} />
                  </div>
                )}

                {activeTool === 'contact' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setActiveTool('menu')} className="h-8 w-8 text-primary">
                          <ArrowLeftCircle className="w-5 h-5" />
                        </Button>
                        <span className="text-xs font-bold uppercase tracking-widest">Share Contact</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setActiveTool('none')} className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <ContactPickerInline onPicked={(c: any) => handleSendMessage({ sharedContact: c })} currentUserId={user?.uid} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setActiveTool(activeTool === 'none' ? 'menu' : 'none')}
            className={cn(
              "rounded-xl h-11 w-11 transition-all",
              activeTool !== 'none' ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"
            )}
          >
            {activeTool === 'none' ? <MoreHorizontal className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>

          <div className="flex-1 relative">
            <Input 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="Write a message..." 
              className="bg-white/5 border-white/10 h-11 rounded-xl focus:ring-primary focus-visible:ring-offset-0" 
            />
          </div>
          <Button onClick={() => handleSendMessage()} disabled={!inputText.trim()} className="bg-primary hover:glow-green text-primary-foreground h-11 w-11 rounded-xl active:scale-95 transition-all shrink-0"><Send className="w-5 h-5" /></Button>
        </div>
      </footer>
    </div>
  );
}

function MessageRow({ msg, user, isMobile, onVote, onDelete, onReply, onSelect, isSelected, otherProfile, contactRecord }: any) {
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

  const handleReplyClick = () => {
    if (msg.replyTo?.isStatus && msg.replyTo.statusUid) {
      router.push(`/chat/status?uid=${msg.replyTo.statusUid}`);
    }
  };

  return (
    <div className={cn("flex w-full group relative px-2", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && !isSystem && (
        <motion.div 
          style={{ opacity: replyIconOpacity }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
        >
          <Reply className="w-5 h-5" />
        </motion.div>
      )}

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
          "max-w-[85%] md:max-w-[70%] p-3 rounded-2xl text-[13px] relative transition-all duration-300",
          isSelected && "scale-[1.02] ring-2 ring-primary ring-offset-2 ring-offset-[#050505]",
          isSystem ? "bg-white/5 text-muted-foreground italic border border-white/5 text-center px-8" : 
          isOwn ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg" : "bg-[#161616] text-white rounded-tl-none border border-white/5 shadow-md"
        )}
      >
        {msg.replyTo && (
          <div 
            onClick={handleReplyClick}
            className={cn(
              "mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-primary text-[10px] opacity-80 truncate",
              msg.replyTo.isStatus && "cursor-pointer hover:bg-black/40 transition-colors"
            )}
          >
            <p className="font-bold text-primary mb-0.5">{msg.replyTo.isStatus ? 'STATUS' : msg.replyTo.senderName}</p>
            {msg.replyTo.text}
          </div>
        )}

        {msg.text && <p className="leading-relaxed">{msg.text}</p>}

        {msg.poll && (
          <div className="mt-3 space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
            <h4 className="font-bold text-sm mb-3">{msg.poll.question}</h4>
            {msg.poll.options.map((opt: string, idx: number) => {
              const votes = msg.poll.votes[idx] || [];
              const totalVotes = Object.values(msg.poll.votes as Record<string, string[]>).flat().length;
              const percent = totalVotes > 0 ? (votes.length / totalVotes) * 100 : 0;
              const hasVoted = votes.includes(user?.uid);
              return (
                <button key={idx} onClick={() => onVote(idx)} className="w-full relative h-10 rounded-lg overflow-hidden border border-white/10 transition-all hover:border-primary/50">
                  <div className="absolute inset-0 bg-primary/20 transition-all duration-500" style={{ width: `${percent}%` }} />
                  <div className="relative z-10 px-4 flex justify-between items-center h-full font-bold uppercase text-[9px] tracking-widest">
                    <span className="truncate mr-2">{opt}</span>
                    <span className="flex items-center gap-1 shrink-0">{votes.length} {hasVoted && <Check className="w-3 h-3 text-white stroke-[3.5]" />}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {msg.sharedContact && (
          <div className="mt-2 bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xl shadow-inner">{msg.sharedContact.name.charAt(0)}</div>
            <div className="text-center">
              <p className="font-bold text-xs uppercase tracking-widest">{msg.sharedContact.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">@{msg.sharedContact.username}</p>
            </div>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => router.push(`/chat/new-${msg.sharedContact.uid}`)}
              className="w-full h-10 text-[9px] font-bold uppercase tracking-widest bg-white/5 hover:bg-primary/20 hover:text-primary transition-all rounded-xl"
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Message
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-1 items-center mt-1 text-[9px] font-black uppercase">
          <span className="opacity-60">{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : ''}</span>
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
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-primary transition-colors"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#111] border-white/10 text-white min-w-[160px] rounded-xl shadow-2xl z-[100]">
                <DropdownMenuItem onClick={onReply} className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary p-3 text-[10px] uppercase font-bold tracking-widest">
                  <Reply className="w-3 h-3" /> Reply
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary p-3 text-[10px] uppercase font-bold tracking-widest">
                  <Forward className="w-3 h-3" /> Forward
                </DropdownMenuItem>
                {isOwn && (
                  <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary p-3 text-[10px] uppercase font-bold tracking-widest">
                    <Pencil className="w-3 h-3" /> Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/5" />
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer focus:bg-destructive/10 focus:text-destructive p-3 text-[10px] uppercase font-bold tracking-widest text-destructive">
                      <Trash2 className="w-3 h-3" /> Delete
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0d0d0d] border-white/10 text-white rounded-[2rem] p-8">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-headline uppercase tracking-tight">Erase Content?</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 pt-6">
                      <Button onClick={() => onDelete('me')} variant="secondary" className="h-14 rounded-xl text-xs font-bold uppercase tracking-widest">Delete for Me</Button>
                      {isOwn && (
                        <Button onClick={() => onDelete('everyone')} variant="destructive" className="h-14 rounded-xl text-xs font-bold uppercase tracking-widest">Delete for Everyone</Button>
                      )}
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
        <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Question</Label>
        <Input 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)} 
          placeholder="What's the topic?" 
          className="bg-white/5 border-white/5 h-11 text-xs focus:ring-primary focus-visible:ring-offset-0 rounded-xl" 
        />
      </div>
      <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
        {options.map((opt, i) => (
          <Input 
            key={i} 
            value={opt} 
            onChange={(e) => handleOptionChange(i, e.target.value)} 
            placeholder={`Option ${i+1}`} 
            className="bg-white/5 border-white/5 h-10 text-xs focus:ring-primary focus-visible:ring-offset-0 rounded-xl" 
          />
        ))}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleAddOption} 
          className="w-full text-[9px] font-bold uppercase tracking-[0.2em] text-primary hover:bg-primary/10 rounded-xl h-8"
        >
          Add Option +
        </Button>
      </div>
      <Button 
        onClick={() => onCreated({ question, options, votes: {} })} 
        disabled={isInvalid} 
        className="w-full h-11 bg-primary hover:glow-green uppercase font-black text-[10px] tracking-widest text-primary-foreground rounded-xl transition-all"
      >
        Share with Chat
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Network..." 
          className="bg-white/5 border-white/5 pl-9 h-10 text-[11px] rounded-xl focus:ring-primary"
        />
      </div>
      <ScrollArea className="h-[180px]">
        <div className="space-y-1">
          {filtered.map(p => (
            <button 
              key={p.id} 
              onClick={() => onPicked({ uid: p.id, name: p.fullName || p.displayName, username: p.username })} 
              className="w-full p-2.5 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs group-hover:scale-110 transition-transform">
                {(p.fullName || p.displayName || 'U').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-white truncate">{p.fullName || p.displayName}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-widest">@{p.username}</p>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-all" />
            </button>
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="py-10 text-center opacity-30">
              <p className="text-[9px] font-bold uppercase tracking-widest">No matching contacts</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
