
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Search, MoreVertical, X, Info, ArrowLeft, Loader2,
  Check, Reply, CheckCheck, Trash2, Pencil, Plus, Tag, Mail, AtSign,
  Share2, BarChart2, UserPlus, Forward, MessageSquare, User, UserCheck, Smile
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
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { 
  doc, query, collection, serverTimestamp, 
  getDocs, where, addDoc, updateDoc, increment, onSnapshot, writeBatch,
  arrayUnion, arrayRemove, deleteField
} from 'firebase/firestore';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  forwarded?: boolean;
  reactions?: Record<string, string>;
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
    voters?: Record<string, number>;
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
  unreadCount?: Record<string, number>;
};

const COMMON_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];

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
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  const isNewChat = conversationId.startsWith('new-');
  const targetUid = isNewChat ? conversationId.replace('new-', '') : null;

  const convRef = useMemoFirebase(() => {
    if (!db || isNewChat || !user?.uid) return null;
    return doc(db, 'conversations', conversationId);
  }, [db, conversationId, isNewChat, user?.uid]);
  
  const { data: conversation } = useDoc<Conversation>(convRef);

  const msgQuery = useMemoFirebase(() => {
    if (!db || isNewChat || !user?.uid) return null;
    return query(collection(db, 'conversations', conversationId, 'messages'));
  }, [db, conversationId, isNewChat, user?.uid]);
  
  const { data: rawMessages } = useCollection<Message>(msgQuery);

  const messages = useMemo(() => {
    if (!rawMessages || !user?.uid) return [];
    return [...rawMessages]
      .filter(m => !m.deletedFor?.includes(user.uid))
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
  }, [rawMessages, user?.uid]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.text?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);
  const [contactRecord, setContactRecord] = useState<ContactRecord | null>(null);

  useEffect(() => {
    if (!user?.uid || !db || isNewChat || !conversationId) return;

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
  }, [inputText, user?.uid, db, conversationId, isNewChat]);

  useEffect(() => {
    if (!db || isNewChat || !user?.uid || !rawMessages) return;

    const unreadFromOther = rawMessages.filter(m => m.senderId !== user.uid && m.status !== 'read');
    if (unreadFromOther.length > 0) {
      const batch = writeBatch(db);
      unreadFromOther.forEach(m => {
        const mRef = doc(db, 'conversations', conversationId, 'messages', m.id);
        batch.update(mRef, { status: 'read', updatedAt: serverTimestamp() });
      });
      batch.commit().catch(() => {});
    }

    const cRef = doc(db, 'conversations', conversationId);
    updateDoc(cRef, { [`unreadCount.${user.uid}`]: 0 }).catch(() => {});

  }, [db, conversationId, isNewChat, user?.uid, rawMessages]);

  useEffect(() => {
    if (searchParams.get('info') === 'true') setShowProfile(true);
  }, [searchParams]);

  useEffect(() => {
    const uid = targetUid || conversation?.participantIds.find(id => id !== user?.uid);
    if (!uid || !db || !user?.uid) {
      setOtherProfile(null);
      setContactRecord(null);
      return;
    }
    const unsubProfile = onSnapshot(doc(db, 'users', uid), (snap) => snap.exists() && setOtherProfile(snap.data() as UserProfile));
    const unsubContact = onSnapshot(doc(db, 'users', user.uid, 'contacts', uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ContactRecord;
        setContactRecord(data);
        setNewNickname(data.customName || '');
      } else {
        setContactRecord(null);
      }
    });
    return () => {
      unsubProfile();
      unsubContact();
    }
  }, [conversation, targetUid, user?.uid, db]);

  useEffect(() => {
    if (scrollRef.current && filteredMessages.length > 0) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const handleSendMessage = async (payloadOverride?: Partial<Message>) => {
    if ((!inputText.trim() && !payloadOverride) || !user?.uid || !db || !otherProfile) return;
    
    if (editingMessage) {
      const text = inputText;
      const ref = doc(db, 'conversations', conversationId, 'messages', editingMessage.id);
      updateDoc(ref, { text, isEdited: true, updatedAt: serverTimestamp() }).catch(() => {});
      setEditingMessage(null);
      setInputText('');
      return;
    }

    const text = inputText;
    let replyData = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.text,
      senderId: replyingTo.senderId,
      senderName: replyingTo.senderId === user.uid ? 'You' : (contactRecord?.customName || otherProfile?.fullName || 'User')
    } : null;

    setInputText('');
    setReplyingTo(null);
    setShowActionMenu(false);
    setShowPollCreator(false);
    setShowContactPicker(false);

    let activeId = conversationId;
    let pIds = (conversation?.participantIds || [user.uid, otherProfile.id]).sort();

    if (isNewChat) {
      const existing = await getDocs(query(collection(db, 'conversations'), where('participantIds', '==', pIds)));
      if (existing.empty) {
        const newConv = await addDoc(collection(db, 'conversations'), {
          participantIds: pIds,
          updatedAt: serverTimestamp(),
          lastMessage: text || (payloadOverride?.poll ? 'Shared a Poll' : 'Shared a Contact'),
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
      await updateDoc(doc(db, 'conversations', activeId), { hiddenFor: [] });
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
      lastMessage: text || (payloadOverride?.poll ? 'Shared a Poll' : 'Shared a Contact'),
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherProfile.id}`]: increment(1),
      [`typing.${user.uid}`]: false
    }).catch(() => {});
  };

  const handleUpdateNickname = async () => {
    if (!user?.uid || !db || !otherProfile || isSavingNickname) return;
    setIsSavingNickname(true);
    try {
      const contactRef = doc(db, 'users', user.uid, 'contacts', otherProfile.id);
      await updateDoc(contactRef, {
        customName: newNickname.trim(),
        updatedAt: serverTimestamp()
      });
      setIsEditingNickname(false);
      toast({ title: "Updated" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update failed." });
    } finally {
      setIsSavingNickname(false);
    }
  };

  const deleteMessage = async (mode: 'me' | 'everyone') => {
    if (!user?.uid || !db || !deletingMessage) return;
    const ref = doc(db, 'conversations', conversationId, 'messages', deletingMessage.id);
    if (mode === 'me') {
      updateDoc(ref, { deletedFor: arrayUnion(user.uid) });
    } else if (mode === 'everyone' && deletingMessage.senderId === user.uid) {
      updateDoc(ref, { isDeleted: true, text: 'This message was deleted' });
    }
    setDeletingMessage(null);
    setSelectedMessage(null);
    toast({ title: "Message Deleted" });
  };

  const handleForwardMessage = async (targetConvId: string) => {
    if (!user?.uid || !db || !forwardingMessage) return;
    try {
      await addDoc(collection(db, 'conversations', targetConvId, 'messages'), {
        text: forwardingMessage.text,
        senderId: user.uid,
        conversationId: targetConvId,
        createdAt: serverTimestamp(),
        status: 'sent',
        forwarded: true
      });
      await updateDoc(doc(db, 'conversations', targetConvId), {
        lastMessage: forwardingMessage.text,
        updatedAt: serverTimestamp(),
        [`unreadCount.${targetConvId.split('-')[1] || ''}`]: increment(1)
      });
      setForwardingMessage(null);
      toast({ title: "Message Shared" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Share failed." });
    }
  };

  const handleReact = async (message: Message, emoji: string) => {
    if (!user || !db || message.isDeleted) return;
    const msgRef = doc(db, 'conversations', message.conversationId, 'messages', message.id);
    
    // Toggle reaction: if already reacted with same emoji, remove it
    if (message.reactions?.[user.uid] === emoji) {
      await updateDoc(msgRef, { [`reactions.${user.uid}`]: deleteField() });
    } else {
      await updateDoc(msgRef, { [`reactions.${user.uid}`]: emoji });
    }
    setSelectedMessage(null);
  };

  const isOtherTyping = useMemo(() => {
    if (!conversation?.typing || !otherProfile) return false;
    return conversation.typing[otherProfile.id] === true;
  }, [conversation?.typing, otherProfile]);

  const mainName = contactRecord?.customName || otherProfile?.displayName || otherProfile?.fullName || 'User';
  const realName = otherProfile?.fullName || otherProfile?.displayName || 'User';
  const initial = mainName.charAt(0).toUpperCase();

  if (isUserLoading) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#050505] overflow-hidden relative">
      <AnimatePresence>
        {selectedMessage && (
          <motion.div 
            initial={{ y: -100 }} 
            animate={{ y: 0 }} 
            exit={{ y: -100 }}
            className="absolute top-0 inset-x-0 h-16 md:h-20 bg-[#0a0a0a] border-b border-primary/20 flex items-center justify-between px-4 md:px-8 z-[100] shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(null)} className="text-white hover:bg-white/5"><X className="w-5 h-5" /></Button>
              
              {/* Quick Reaction Bar */}
              <div className="hidden md:flex items-center gap-1.5 p-1 bg-white/5 rounded-full border border-white/5">
                {COMMON_EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => handleReact(selectedMessage, emoji)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-lg scale-90 hover:scale-125">
                    {emoji}
                  </button>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-primary/20 hover:text-primary rounded-full transition-all bg-white/5 border border-white/5">
                      <Plus className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-[#0d0d0d] border-white/10 p-2 rounded-2xl shadow-2xl">
                    <div className="flex gap-2">
                      <Input placeholder="Type emoji..." className="h-10 bg-white/5 border-white/10 rounded-xl" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleReact(selectedMessage, (e.target as HTMLInputElement).value); }} />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => { setReplyingTo(selectedMessage); setSelectedMessage(null); }} className="text-white hover:text-primary"><Reply className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => { setForwardingMessage(selectedMessage); setSelectedMessage(null); }} className="text-white hover:text-primary"><Forward className="w-4 h-4" /></Button>
              {selectedMessage.senderId === user?.uid && (
                <Button variant="ghost" size="icon" onClick={() => { setEditingMessage(selectedMessage); setInputText(selectedMessage.text); setSelectedMessage(null); }} className="text-white hover:text-primary"><Pencil className="w-4 h-4" /></Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => { setDeletingMessage(selectedMessage); setSelectedMessage(null); }} className="text-destructive hover:bg-destructive/5"><Trash2 className="w-4 h-4" /></Button>
            </div>

            {/* Mobile Reaction Bar Overlay */}
            <div className="md:hidden absolute top-full left-0 right-0 p-3 bg-black/80 backdrop-blur-3xl flex items-center justify-center gap-2 border-b border-white/5 overflow-x-auto no-scrollbar">
              {COMMON_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => handleReact(selectedMessage, emoji)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-xl active:scale-125 transition-transform shrink-0">
                  {emoji}
                </button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-10 h-10 flex items-center justify-center bg-primary/20 text-primary rounded-full shrink-0 border border-primary/20">
                    <Plus className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] bg-[#0d0d0d] border-white/10 p-3 rounded-2xl shadow-2xl mb-4" side="bottom">
                   <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase text-primary tracking-widest text-center">Enter Any Emoji</p>
                      <Input placeholder="Search emojis..." className="h-12 bg-white/5 border-white/10 rounded-xl text-center text-lg" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleReact(selectedMessage, (e.target as HTMLInputElement).value); }} />
                   </div>
                </PopoverContent>
              </Popover>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex-none h-20 px-4 border-b border-white/5 flex items-center justify-between z-[60] bg-black/80 backdrop-blur-3xl">
        <AnimatePresence mode="wait">
          {isSearchMode ? (
            <motion.div key="search-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 w-full">
              <Button variant="ghost" size="icon" onClick={() => { setIsSearchMode(false); setSearchQuery(''); }} className="text-primary"><ArrowLeft className="w-5 h-5" /></Button>
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus placeholder="Search messages..." className="bg-white/5 border-none h-11 pl-10 rounded-full w-full" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="normal-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden text-muted-foreground shrink-0"><ArrowLeft className="w-6 h-6" /></Button>
                <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={() => setShowProfile(true)}>
                  <div className="w-11 h-11 rounded-full border border-primary/20 bg-[#111] flex items-center justify-center shrink-0">
                    <span className="text-base font-bold text-primary not-italic flex items-center justify-center h-full w-full leading-none">{initial}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm md:text-base font-bold text-white truncate uppercase tracking-tight font-headline">
                      {mainName}
                    </h3>
                    <div className="flex items-center gap-2 overflow-hidden">
                       <p className={cn("text-[10px] uppercase font-bold tracking-widest truncate", isOtherTyping ? "text-primary animate-pulse" : otherProfile?.isOnline ? "text-primary" : "text-muted-foreground")}>
                        {isOtherTyping ? 'Typing...' : otherProfile?.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button variant="ghost" size="icon" onClick={() => setIsSearchMode(true)} className="text-muted-foreground hover:text-primary"><Search className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)} className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <ScrollArea className="flex-1 w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 pb-12">
          {filteredMessages.map((msg) => (
            <MessageRow 
              key={msg.id} msg={msg} user={user} isMobile={isMobile}
              onDelete={() => setDeletingMessage(msg)}
              onReply={() => setReplyingTo(msg)}
              onEdit={() => { setEditingMessage(msg); setInputText(msg.text); }}
              onForward={() => setForwardingMessage(msg)}
              onSelect={() => setSelectedMessage(msg)}
              isSelected={selectedMessage?.id === msg.id}
              highlight={searchQuery}
            />
          ))}
          <div ref={scrollRef} className="h-4" />
        </div>
      </ScrollArea>

      <AnimatePresence>
        {showProfile && otherProfile && (
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-y-0 right-0 w-full md:w-96 bg-[#0a0a0a] border-l border-white/5 z-[100] flex flex-col shadow-2xl">
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User Profile</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowProfile(false)} className="h-10 w-10 rounded-full hover:bg-white/5"><X className="w-6 h-6" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center text-center space-y-8 custom-scrollbar">
              <div className="w-28 h-28 rounded-full border-4 border-primary/20 bg-[#111] flex items-center justify-center shadow-2xl shrink-0">
                <span className="text-4xl font-black text-primary not-italic leading-none">{initial}</span>
              </div>
              
              <div className="w-full space-y-4">
                {isEditingNickname ? (
                  <div className="space-y-3">
                    <Input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="Enter new name..." className="bg-white/5 border-white/10 text-center text-base font-bold h-12 rounded-xl" autoFocus />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateNickname} disabled={isSavingNickname} className="flex-1 h-11 bg-primary hover:glow-green text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl">Save</Button>
                      <Button variant="ghost" onClick={() => setIsEditingNickname(false)} className="flex-1 h-11 text-[10px] font-black uppercase text-muted-foreground">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="px-4">
                      <h2 className="text-2xl font-black font-headline tracking-tighter uppercase text-white truncate">{mainName}</h2>
                      {contactRecord?.customName && contactRecord.customName !== realName && (
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 truncate">~ {realName}</p>
                      )}
                      <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1 truncate">@{otherProfile.username}</p>
                    </div>
                    {contactRecord && (
                      <Button onClick={() => setIsEditingNickname(true)} className="w-full h-14 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white/10 px-6">
                        <Pencil className="w-4 h-4 mr-2" /> Rename Contact
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="w-full bg-white/5 rounded-3xl p-6 border border-white/5 text-left space-y-6">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-2">
                    <Info className="w-3 h-3 text-primary" /> About
                  </span>
                  <p className="text-xs leading-relaxed text-white/80">{otherProfile.about || "Digital profile on HappyChat."}</p>
                </div>
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-2">
                      <Mail className="w-3 h-3 text-primary" /> Email
                    </span>
                    <p className="text-xs text-primary truncate font-bold">{otherProfile.email}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-2">
                      <AtSign className="w-3 h-3 text-primary" /> Username
                    </span>
                    <p className="text-xs text-white/80 truncate font-mono tracking-tight">@{otherProfile.username}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <footer className="bg-[#0a0a0a] border-t border-white/5 p-4 relative z-50">
        <AnimatePresence>
          {showPollCreator && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full left-0 right-0 p-4 md:p-8 bg-[#0a0a0a]/95 backdrop-blur-3xl border-t border-white/5 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
              <PollCreatorInline onClose={() => setShowPollCreator(false)} onSend={(poll) => handleSendMessage({ poll })} />
            </motion.div>
          )}
          {showContactPicker && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full left-0 right-0 p-4 md:p-8 bg-[#0a0a0a]/95 backdrop-blur-3xl border-t border-white/5 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
              <ContactPickerInline onClose={() => setShowContactPicker(false)} onSend={(contact) => handleSendMessage({ sharedContact: contact })} />
            </motion.div>
          )}
          {showActionMenu && !showPollCreator && !showContactPicker && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full left-0 right-0 p-4 bg-[#0a0a0a]/95 backdrop-blur-3xl border-t border-white/5 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
                <button onClick={() => setShowPollCreator(true)} className="flex flex-col items-center justify-center p-6 md:p-10 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:glow-green transition-all"><BarChart2 className="w-5 h-5 md:w-7 md:h-7 text-primary" /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Quick Poll</span>
                </button>
                <button onClick={() => setShowContactPicker(true)} className="flex flex-col items-center justify-center p-6 md:p-10 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:glow-green transition-all"><UserPlus className="w-5 h-5 md:w-7 md:h-7 text-primary" /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Share Contact</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto">
          {replyingTo && (
            <div className="px-4 py-2 bg-white/5 border-l-2 border-primary mb-3 flex justify-between items-center rounded-r-xl shadow-lg animate-in slide-in-from-bottom-1">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">Reply to {replyingTo.senderId === user?.uid ? 'You' : mainName}</p>
                <p className="text-xs text-muted-foreground truncate">{replyingTo.text}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-8 w-8 shrink-0 text-white/40 hover:text-white"><X className="w-4 h-4" /></Button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => { if (showPollCreator || showContactPicker) { setShowPollCreator(false); setShowContactPicker(false); } else { setShowActionMenu(!showActionMenu); } }} className={cn("rounded-xl h-11 w-11 md:h-12 md:w-12 shrink-0 bg-white/5 hover:bg-white/10 transition-all", (showActionMenu || showPollCreator || showContactPicker) && "bg-primary/20 text-primary rotate-45")}>
              {(showActionMenu || showPollCreator || showContactPicker) ? <X className="w-6 h-6" /> : <MoreVertical className="w-6 h-6" />}
            </Button>
            <div className="flex-1 relative min-w-0">
              <Input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={editingMessage ? "Update message..." : "Type message..."} className="bg-white/5 border-white/10 h-11 md:h-12 rounded-xl focus:ring-primary focus-visible:ring-offset-0 text-sm w-full" />
            </div>
            <Button onClick={() => handleSendMessage()} disabled={!inputText.trim()} className="bg-primary hover:glow-green text-primary-foreground h-11 w-11 md:h-12 md:w-12 rounded-xl shrink-0 transition-all active:scale-90"><Send className="w-5 h-5" /></Button>
          </div>
        </div>
      </footer>

      <AlertDialog open={!!deletingMessage} onOpenChange={() => setDeletingMessage(null)}>
        <AlertDialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2.5rem] shadow-2xl max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline uppercase tracking-tight text-gradient">Delete Message?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">How would you like to delete this?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2">
            <Button onClick={() => deleteMessage('me')} className="h-12 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Delete for Me</Button>
            {deletingMessage?.senderId === user?.uid && <Button onClick={() => deleteMessage('everyone')} variant="destructive" className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Delete for Everyone</Button>}
            <AlertDialogCancel className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white h-10">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ForwardPicker open={!!forwardingMessage} onClose={() => setForwardingMessage(null)} onForward={handleForwardMessage} />
    </div>
  );
}

function MessageRow({ msg, user, isMobile, onDelete, onReply, onEdit, onForward, onSelect, isSelected, highlight }: any) {
  const db = useFirestore();
  const isOwn = msg.senderId === user?.uid;
  const isSystem = msg.isDeleted;
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dragX = useMotionValue(0);
  const swipeOpacity = useTransform(dragX, [0, 60], [0, 1]);
  const swipeScale = useTransform(dragX, [0, 60], [0.5, 1.1]);

  const handlePointerDown = () => {
    if (!isMobile) return;
    holdTimerRef.current = setTimeout(() => { onSelect(); if (window.navigator.vibrate) window.navigator.vibrate(50); }, 600); 
  };
  const handlePointerUp = () => { if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; } };
  const handleDragEnd = (_: any, info: any) => { if (info.offset.x > 60) onReply(); };

  const renderText = (text: string) => {
    if (!highlight || !highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => part.toLowerCase() === highlight.toLowerCase() ? <span key={i} className="bg-primary/40 text-white rounded-sm px-0.5 glow-green">{part}</span> : part);
  };

  const handleVote = async (optionIndex: number) => {
    if (!user || !db || isSystem || !msg.poll) return;
    const msgRef = doc(db, 'conversations', msg.conversationId, 'messages', msg.id);
    updateDoc(msgRef, { [`poll.voters.${user.uid}`]: optionIndex }).catch(() => {});
  };

  const voters = msg.poll?.voters || {};
  const totalVotes = Object.keys(voters).length;
  const myVote = voters[user?.uid || ''];

  const pollResults = useMemo(() => {
    if (!msg.poll) return [];
    const counts = new Array(msg.poll.options.length).fill(0);
    Object.values(voters).forEach((val: any) => { if (counts[val] !== undefined) counts[val]++; });
    return counts.map(c => totalVotes > 0 ? Math.round((c / totalVotes) * 100) : 0);
  }, [msg.poll, voters, totalVotes]);

  const reactionSummary = useMemo(() => {
    if (!msg.reactions) return null;
    const counts: Record<string, number> = {};
    Object.values(msg.reactions).forEach(emoji => {
      counts[emoji as string] = (counts[emoji as string] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [msg.reactions]);

  return (
    <div className="flex w-full group relative mb-1 min-w-0 items-center overflow-hidden">
      <div className="absolute left-0 flex items-center justify-center w-14 h-full pointer-events-none z-0">
        <motion.div style={{ opacity: swipeOpacity, scale: swipeScale }} className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full border border-primary/30 shadow-[0_0_15px_rgba(0,200,83,0.2)]">
          <Reply className="w-4 h-4 text-primary" />
        </motion.div>
      </div>

      <motion.div 
        drag={isMobile ? "x" : false} dragConstraints={{ left: 0, right: 100 }} dragElastic={0.15} dragSnapToOrigin onDragEnd={handleDragEnd} style={{ x: dragX }}
        onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} 
        className={cn("w-full flex z-10", isOwn ? "justify-end" : "justify-start")}
      >
        <div className="relative max-w-[85%] group/bubble">
          <div 
            onClick={() => !isMobile && onSelect()}
            className={cn(
              "p-2 px-3 rounded-2xl text-[13px] relative transition-all duration-300 break-words min-w-0 shadow-sm cursor-pointer", 
              isSelected && "ring-2 ring-primary shadow-[0_0_20px_rgba(0,200,83,0.3)] scale-[1.02]", 
              isSystem ? "bg-white/5 text-muted-foreground italic text-center px-6 py-2 border border-dashed border-white/10 text-[11px] mx-auto" : isOwn ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-[#181818] text-white rounded-tl-none border border-white/5"
            )}
          >
            {msg.forwarded && <div className="flex items-center gap-1.5 mb-1 opacity-60 text-[8px] font-black uppercase italic tracking-widest"><Forward className="w-2 h-2" /> Forwarded</div>}
            {msg.replyTo && <div className="mb-2 p-1.5 bg-black/20 rounded-lg border-l-2 border-primary text-[10px] opacity-80 truncate max-w-full"><p className="font-bold text-primary mb-0.5 uppercase tracking-widest text-[8px]">{msg.replyTo.senderName}</p><span className="block truncate">{msg.replyTo.text}</span></div>}
            {msg.poll && (
              <div className="mb-2 p-3 bg-black/60 rounded-xl border border-white/10 space-y-2.5 shadow-2xl min-w-[180px] max-w-full">
                <div className="flex items-center gap-2 text-primary"><BarChart2 className="w-3 h-3 shrink-0" /><span className="font-black uppercase tracking-tight text-[10px] truncate">{msg.poll.question}</span></div>
                <div className="space-y-1">
                    {msg.poll.options.map((opt: string, i: number) => {
                      const pct = pollResults[i] || 0;
                      const isMyVote = myVote === i;
                      return (
                        <button key={i} onClick={() => handleVote(i)} disabled={isSystem} className={cn("w-full relative h-8 bg-white/5 border rounded-lg px-3 overflow-hidden group transition-all", isMyVote ? "border-primary/50" : "border-white/5 hover:border-primary/20")}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={cn("absolute inset-y-0 left-0", isMyVote ? "bg-primary/20" : "bg-primary/10")} />
                          <div className="relative flex justify-between items-center w-full z-10 gap-2"><span className={cn("text-[10px] font-bold truncate", isMyVote ? "text-primary" : "text-white/70 group-hover:text-white")}>{opt}</span><span className="text-[8px] font-black opacity-50 shrink-0">{pct}%</span></div>
                        </button>
                      );
                    })}
                </div>
                <p className="text-[7px] font-black uppercase tracking-widest text-center text-muted-foreground opacity-50">{totalVotes} Votes</p>
              </div>
            )}
            {msg.sharedContact && (
              <div className="mb-2 p-3 bg-[#0d0d0d] rounded-xl border border-white/10 flex items-center gap-3 shadow-2xl max-w-full">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black text-sm shrink-0">{msg.sharedContact.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="text-[11px] font-black uppercase tracking-tight truncate text-white">{msg.sharedContact.name}</p><p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest truncate">@{msg.sharedContact.username}</p></div>
                  <Button size="sm" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:glow-green transition-all shadow-lg shrink-0">View</Button>
              </div>
            )}
            {msg.text && <p className="leading-relaxed whitespace-pre-wrap font-medium">{renderText(msg.text)}</p>}
            <div className="flex justify-end gap-1.5 items-center mt-1 text-[7px] font-black uppercase tracking-widest">
              {msg.isEdited && <span className="mr-1 italic-bold opacity-70">(edited)</span>}
              <span className="opacity-60">{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : ''}</span>
              {isOwn && !isSystem && (
                <div className="flex items-center ml-1">
                  {msg.status === 'read' ? (
                    <CheckCheck 
                      strokeWidth={5} 
                      className="w-3.5 h-3.5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" 
                    /> 
                  ) : (
                    <Check 
                      strokeWidth={4} 
                      className="w-3.5 h-3.5 text-white" 
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reaction Display */}
          {reactionSummary && reactionSummary.length > 0 && (
            <div className={cn(
              "flex flex-wrap gap-1 mt-1",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {reactionSummary.map(([emoji, count]) => (
                <div 
                  key={emoji} 
                  className="inline-flex items-center gap-1 bg-[#111] border border-white/10 rounded-full px-2 py-0.5 shadow-lg group/reaction transition-all hover:scale-110"
                >
                  <span className="text-xs">{emoji}</span>
                  {count > 1 && <span className="text-[8px] font-black text-primary uppercase">{count}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function PollCreatorInline({ onClose, onSend }: { onClose: () => void, onSend: (poll: any) => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const handleAddOption = () => setOptions([...options, '']);
  const handleOptionChange = (idx: number, val: string) => { const newOptions = [...options]; newOptions[idx] = val; setOptions(newOptions); };
  const handleCreate = () => { if (!question.trim() || options.filter(o => o.trim()).length < 2) return; onSend({ question: question.trim(), options: options.filter(o => o.trim() !== ''), voters: {} }); setQuestion(''); setOptions(['', '']); };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-lg md:text-xl font-black font-headline uppercase italic text-gradient tracking-tight">Create Poll</h2><p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Ask a question to the group</p></div><Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></Button></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">The Question</Label><Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Meet at 8 PM?" className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-primary text-sm shadow-inner" autoFocus /></div>
        <div className="space-y-2"><Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Options</Label><div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">{options.map((opt, i) => (<Input key={i} value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} placeholder={`Option ${i+1}`} className="bg-white/5 border-white/10 rounded-xl h-10 focus:ring-primary text-xs" />))}</div><Button variant="ghost" onClick={handleAddOption} className="text-[8px] uppercase font-black text-primary tracking-widest p-0 h-6 hover:bg-transparent hover:text-white transition-colors"><Plus className="w-3 h-3 mr-1" /> Add Option</Button></div>
      </div>
      <Button onClick={handleCreate} disabled={!question.trim() || options.filter(o => o.trim()).length < 2} className="w-full h-14 bg-primary hover:glow-green text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl transition-all active:scale-95">Send Poll</Button>
    </div>
  );
}

function ContactPickerInline({ onClose, onSend }: { onClose: () => void, onSend: (contact: any) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;
    const fetchContacts = async () => {
      const snap = await getDocs(collection(db, 'users', user.uid, 'contacts'));
      const contactIds = snap.docs.map(d => d.id);
      if (contactIds.length === 0) { setProfiles([]); setLoading(false); return; }
      const usersSnap = await getDocs(query(collection(db, 'users'), where('id', 'in', contactIds)));
      setProfiles(usersSnap.docs.map(d => d.data() as UserProfile));
      setLoading(false);
    };
    fetchContacts();
  }, [user, db]);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-lg md:text-xl font-black font-headline uppercase italic text-gradient tracking-tight">Share Contact</h2><p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Send a contact to this chat</p></div><Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></Button></div>
      <ScrollArea className="h-64 rounded-3xl bg-white/[0.02] border border-white/5 p-3">
        {loading ? (<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>) : profiles.length === 0 ? (<div className="text-center py-20 opacity-30 text-[9px] font-black uppercase tracking-widest italic">No Contacts Found</div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{profiles.map(p => (<button key={p.id} onClick={() => onSend({ uid: p.id, name: p.fullName || p.displayName || p.username, username: p.username })} className="w-full flex items-center h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-4 gap-3 hover:bg-primary/10 group transition-all text-left"><div className="w-8 h-8 rounded-full bg-[#111] border border-white/10 flex items-center justify-center font-bold text-primary group-hover:glow-green transition-all uppercase text-xs">{p.username[0]}</div><div className="flex-1 min-w-0"><p className="text-[11px] font-black uppercase truncate group-hover:text-primary transition-colors text-white">{p.fullName}</p><p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest truncate">@{p.username}</p></div></button>))}</div>)}
      </ScrollArea>
    </div>
  );
}

function ForwardPicker({ open, onClose, onForward }: { open: boolean, onClose: () => void, onForward: (id: string) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [convs, setConvs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!user || !db || !open) return;
    const unsub = onSnapshot(query(collection(db, 'conversations'), where('participantIds', 'array-contains', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConvs(data);
      data.forEach(c => {
        const otherId = c.participantIds.find((id: string) => id !== user.uid);
        if (otherId && !profiles[otherId]) { onSnapshot(doc(db, 'users', otherId), s => { if (s.exists()) setProfiles(prev => ({ ...prev, [otherId]: s.data() as UserProfile })); }); }
      });
    });
    return () => unsub();
  }, [user, db, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2.5rem] p-0 overflow-hidden max-w-[calc(100%-2rem)] md:max-w-sm shadow-2xl">
        <DialogHeader className="p-6 pb-4"><DialogTitle className="text-xl font-black font-headline uppercase italic text-gradient tracking-tight text-center md:text-left">Share Message</DialogTitle><DialogDescription className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center md:text-left">Send this to another chat</DialogDescription></DialogHeader>
        <ScrollArea className="h-80 px-4 pb-6">
          <div className="space-y-1.5">{convs.map(c => { const otherId = c.participantIds.find((id: string) => id !== user?.uid); const p = profiles[otherId]; const name = p?.displayName || p?.fullName || 'User'; return (<Button key={c.id} onClick={() => onForward(c.id)} variant="ghost" className="w-full justify-start h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-4 gap-3 hover:bg-primary/10 group transition-all"><div className="w-9 h-9 rounded-full bg-[#111] border border-white/10 flex items-center justify-center font-bold text-primary group-hover:glow-green transition-all text-sm">{name[0].toUpperCase()}</div><div className="text-left min-w-0 flex-1"><p className="text-[11px] font-black uppercase truncate group-hover:text-primary transition-colors text-white">{name}</p><p className="text-[9px] uppercase font-bold text-muted-foreground truncate tracking-widest">{c.lastMessage || 'Recent chat'}</p></div></Button>); })}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
