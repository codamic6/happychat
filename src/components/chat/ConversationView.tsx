'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Paperclip, Smile, Search, 
  MoreVertical, X, Info, ShieldAlert, ArrowLeft, Loader2,
  ShieldCheck, Copy, Forward, Pencil, Check, Reply, UserCircle, Tag, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { 
  doc, query, collection, serverTimestamp, 
  getDocs, where, addDoc, updateDoc, increment, setDoc, onSnapshot
} from 'firebase/firestore';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  conversationParticipantIds: string[];
  isEdited?: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
  };
};

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  email: string;
  about?: string;
};

type ContactRecord = {
  id: string;
  userId: string;
  customName?: string;
};

type Conversation = {
  id: string;
  participantIds: string[];
};

export function ConversationView({ conversationId }: { conversationId: string }) {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [inputText, setInputText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Message Actions State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Mobile Long Press Timer
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const isNewChat = conversationId.startsWith('new-');
  const targetUid = isNewChat ? conversationId.replace('new-', '') : null;

  const convRef = useMemoFirebase(() => {
    if (!db || isNewChat) return null;
    return doc(db, 'conversations', conversationId);
  }, [db, conversationId, isNewChat]);
  
  const { data: conversation } = useDoc<Conversation>(convRef);

  const msgQuery = useMemoFirebase(() => {
    if (!db || isNewChat || !user) return null;
    return query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('conversationParticipantIds', 'array-contains', user.uid)
    );
  }, [db, conversationId, isNewChat, user]);
  
  const { data: rawMessages } = useCollection<Message>(msgQuery);

  const messages = useMemo(() => {
    if (!rawMessages) return [];
    return [...rawMessages].sort((a, b) => {
      const timeA = a.timestamp?.toMillis?.() || 0;
      const timeB = b.timestamp?.toMillis?.() || 0;
      return timeA - timeB;
    });
  }, [rawMessages]);

  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);
  const [contactRecord, setContactRecord] = useState<ContactRecord | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!db || !user) return;
    const fetchMyProfile = async () => {
      const q = query(collection(db, 'users'), where('id', '==', user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) setCurrentUserProfile(snap.docs[0].data() as UserProfile);
    };
    fetchMyProfile();
  }, [db, user]);

  useEffect(() => {
    const uid = targetUid || conversation?.participantIds.find(id => id !== user?.uid);
    if (!uid || !db || !user) return;

    // Listen to profile updates
    const q = query(collection(db, 'users'), where('id', '==', uid));
    const unsubProfile = onSnapshot(q, (snap) => {
      if (!snap.empty) setOtherProfile(snap.docs[0].data() as UserProfile);
    });

    // Listen to contact relationship updates (for custom names)
    const contactRef = doc(db, 'users', user.uid, 'contacts', uid);
    const unsubContact = onSnapshot(contactRef, (snap) => {
      if (snap.exists()) {
        setContactRecord(snap.data() as ContactRecord);
      } else {
        setContactRecord(null);
      }
    });

    return () => {
      unsubProfile();
      unsubContact();
    };
  }, [conversation, targetUid, user, db]);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !db || !otherProfile) return;
    const text = inputText;
    
    let replyData = null;
    if (replyingTo) {
      const originalSenderIsMe = replyingTo.senderId === user.uid;
      const originalSenderName = originalSenderIsMe 
        ? (currentUserProfile?.displayName || currentUserProfile?.fullName || 'User')
        : (contactRecord?.customName || otherProfile?.displayName || otherProfile?.fullName || 'User');

      replyData = {
        id: replyingTo.id,
        text: replyingTo.text,
        senderId: replyingTo.senderId,
        senderName: originalSenderName
      };
    }

    setInputText('');
    setReplyingTo(null);

    let activeId = conversationId;
    let participantIds = (conversation?.participantIds || [user.uid, otherProfile.id]).sort();

    if (isNewChat) {
      const existingQ = query(collection(db, 'conversations'), where('participantIds', '==', participantIds));
      const snap = await getDocs(existingQ);
      if (snap.empty) {
        const newConv = await addDoc(collection(db, 'conversations'), {
          participantIds,
          updatedAt: serverTimestamp(),
          lastMessage: text,
          unreadCount: { [otherProfile.id]: 1, [user.uid]: 0 }
        });
        activeId = newConv.id;
        router.replace(`/chat/${activeId}`);
      } else {
        activeId = snap.docs[0].id;
        router.replace(`/chat/${activeId}`);
      }
    }

    addDoc(collection(db, 'conversations', activeId, 'messages'), {
      text,
      senderId: user.uid,
      timestamp: serverTimestamp(),
      conversationParticipantIds: participantIds,
      replyTo: replyData
    });

    if (!isNewChat) {
      updateDoc(doc(db, 'conversations', activeId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        [`unreadCount.${otherProfile.id}`]: increment(1)
      });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Message copied to clipboard." });
    setSelectedMessage(null);
  };

  const startEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditValue(msg.text);
    setSelectedMessage(null);
  };

  const saveEdit = async () => {
    if (!editingMessageId || !db || !conversationId) return;
    const ref = doc(db, 'conversations', conversationId, 'messages', editingMessageId);
    await updateDoc(ref, {
      text: editValue,
      isEdited: true
    });
    setEditingMessageId(null);
    setEditValue('');
  };

  const handleForward = async (targetContact: ContactRecord) => {
    if (!selectedMessage || !user || !db) return;
    
    const participantIds = [user.uid, targetContact.userId].sort();
    const q = query(collection(db, 'conversations'), where('participantIds', '==', participantIds));
    const snap = await getDocs(q);
    
    let targetConvId;
    if (snap.empty) {
      const newC = await addDoc(collection(db, 'conversations'), {
        participantIds,
        updatedAt: serverTimestamp(),
        lastMessage: selectedMessage.text,
        unreadCount: { [targetContact.userId]: 1, [user.uid]: 0 }
      });
      targetConvId = newC.id;
    } else {
      targetConvId = snap.docs[0].id;
    }

    await addDoc(collection(db, 'conversations', targetConvId, 'messages'), {
      text: selectedMessage.text,
      senderId: user.uid,
      timestamp: serverTimestamp(),
      conversationParticipantIds: participantIds
    });

    toast({ title: "Forwarded", description: "Message sent." });
    setIsForwardDialogOpen(false);
    setSelectedMessage(null);
  };

  const handleTouchStart = (msg: Message) => {
    if (!isMobile) return;
    longPressTimer.current = setTimeout(() => {
      setSelectedMessage(msg);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const mainName = contactRecord?.customName || otherProfile?.displayName || otherProfile?.fullName || 'User';
  const subName = contactRecord?.customName ? (otherProfile?.displayName || otherProfile?.fullName) : null;
  const initial = mainName.charAt(0).toUpperCase();

  return (
    <div className="flex-1 flex flex-col relative bg-[#050505] overflow-hidden">
      <header className={cn(
        "flex-none h-16 px-4 md:px-6 border-b border-white/5 flex items-center justify-between transition-all duration-300 z-50 sticky top-0",
        (selectedMessage && isMobile) ? "bg-primary text-primary-foreground" : "bg-black/80 backdrop-blur-3xl"
      )}>
        <AnimatePresence mode="wait">
          {(selectedMessage && isMobile) ? (
            <motion.div 
              key="selection-mode"
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(null)} className="hover:bg-black/10">
                  <X className="w-6 h-6" />
                </Button>
                <span className="font-bold uppercase tracking-widest text-xs">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setReplyingTo(selectedMessage); setSelectedMessage(null); }} className="hover:bg-black/10">
                  <Reply className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(selectedMessage.text)} className="hover:bg-black/10">
                  <Copy className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsForwardDialogOpen(true)} className="hover:bg-black/10">
                  <Forward className="w-5 h-5" />
                </Button>
                {selectedMessage.senderId === user?.uid && (
                  <Button variant="ghost" size="icon" onClick={() => startEdit(selectedMessage)} className="hover:bg-black/10">
                    <Pencil className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="normal-header"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden text-muted-foreground">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={() => setShowProfile(true)}>
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-lg bg-[#111] flex items-center justify-center shrink-0">
                    <div className="text-sm font-bold text-primary">{initial}</div>
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors leading-tight">
                      {mainName}
                    </h3>
                    {subName && (
                      <p className="text-[9px] text-muted-foreground truncate uppercase font-bold tracking-widest opacity-60">
                        {subName}
                      </p>
                    )}
                    {!subName && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[8px] text-primary uppercase font-bold tracking-widest">Active</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Search className="w-5 h-5" /></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#0d0d0d] border-white/10 text-white rounded-2xl p-1 shadow-2xl">
                    <DropdownMenuItem onClick={() => setShowProfile(true)} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 rounded-xl">
                      <Info className="w-4 h-4 text-primary" /> 
                      <span className="text-xs font-bold uppercase tracking-widest">User Info</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-destructive/10 text-destructive rounded-xl">
                      <ShieldAlert className="w-4 h-4" /> 
                      <span className="text-xs font-bold uppercase tracking-widest">Block</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <ScrollArea className="flex-1 p-4 md:p-6 relative custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-2 pb-12">
          {messages.map((msg) => (
            <MessageRow 
              key={msg.id} 
              msg={msg} 
              user={user} 
              isMobile={isMobile}
              onDoubleTap={() => setReplyingTo(msg)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onCopy={handleCopy}
              onForward={() => { setSelectedMessage(msg); setIsForwardDialogOpen(true); }}
              onEdit={startEdit}
              editingMessageId={editingMessageId}
              editValue={editValue}
              setEditValue={setEditValue}
              saveEdit={saveEdit}
              cancelEdit={() => setEditingMessageId(null)}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <footer className="bg-[#0a0a0a] border-t border-white/5 sticky bottom-0 z-[60]">
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 overflow-hidden border-l-2 border-primary pl-3 py-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Replying to {replyingTo.senderId === user?.uid ? 'You' : (otherProfile?.fullName || 'User')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">{replyingTo.text}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-8 w-8 text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 flex items-center gap-3 max-w-5xl mx-auto">
          <Button size="icon" variant="ghost" className="bg-white/5 rounded-xl h-11 w-11 hover:bg-white/10 transition-colors"><Paperclip className="w-5 h-5 text-muted-foreground" /></Button>
          <div className="flex-1 relative">
            <Input 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="Write a message..." 
              className="bg-white/5 border-white/10 h-11 rounded-xl focus:ring-primary focus-visible:ring-offset-0" 
            />
            <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-muted-foreground hover:text-primary"><Smile className="w-5 h-5" /></Button>
          </div>
          <Button onClick={handleSendMessage} disabled={!inputText.trim()} className="bg-primary hover:glow-green text-primary-foreground h-11 w-11 rounded-xl shadow-xl transition-all active:scale-95">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>

      <ForwardDialog 
        isOpen={isForwardDialogOpen} 
        onOpenChange={setIsForwardDialogOpen} 
        onForward={handleForward}
        contacts={[]} // Should fetch real contacts in a real scenario
      />

      <AnimatePresence>
        {showProfile && (
          <UserProfileSidebar 
            profile={otherProfile} 
            contactRecord={contactRecord}
            onDismiss={() => setShowProfile(false)} 
            otherName={otherProfile?.fullName || 'User'} 
            initial={initial}
            user={user}
            db={db}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageRow({ 
  msg, user, isMobile, 
  onDoubleTap, onTouchStart, onTouchEnd,
  onCopy, onForward, onEdit,
  editingMessageId, editValue, setEditValue, saveEdit, cancelEdit
}: any) {
  const isOwn = msg.senderId === user?.uid;
  const isEditing = editingMessageId === msg.id;
  const timeStr = msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'h:mm a') : '';
  
  const replySenderDisplayName = msg.replyTo ? (msg.replyTo.senderId === user?.uid ? 'You' : msg.replyTo.senderName) : '';

  const dragX = useMotionValue(0);
  const swipeThreshold = 50;

  const handleDragEnd = (_: any, info: any) => {
    if (isOwn) {
      if (info.offset.x > swipeThreshold) onDoubleTap();
    } else {
      if (info.offset.x < -swipeThreshold) onDoubleTap();
    }
  };

  return (
    <div 
      className={cn("flex w-full group/row", isOwn ? "justify-end" : "justify-start")}
      onDoubleClick={() => !isMobile && onDoubleTap()}
    >
      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }} 
        dragSnapToOrigin={true}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className={cn("max-w-[85%] md:max-w-[70%]", isOwn ? "items-end" : "items-start")}
        onTouchStart={() => onTouchStart(msg)}
        onTouchEnd={onTouchEnd}
      >
        {isEditing ? (
          <div className="flex items-end gap-2">
            <Input 
              value={editValue} 
              onChange={(e) => setEditValue(e.target.value)} 
              className="bg-[#111] border-primary/40 rounded-xl"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            />
            <Button size="icon" onClick={saveEdit} className="h-10 w-10 shrink-0 rounded-xl bg-primary"><Check className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground"><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isMobile}>
              <div className={cn(
                "group relative p-2 rounded-xl text-[13px] leading-tight shadow-sm transition-all text-left flex flex-col min-w-[80px] cursor-default",
                isOwn ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white/10 text-white rounded-tl-none border border-white/5"
              )}>
                {msg.replyTo && (
                  <div className={cn(
                    "mb-2 p-2 rounded-lg border-l-4 text-[11px] opacity-90 overflow-hidden",
                    isOwn ? "bg-black/20 border-black/30" : "bg-white/5 border-primary"
                  )}>
                    <p className={cn("font-bold truncate mb-0.5", isOwn ? "text-white" : "text-primary")}>
                      {replySenderDisplayName}
                    </p>
                    <p className={cn("truncate italic", isOwn ? "text-white/80" : "text-white/60")}>
                      {msg.replyTo.text}
                    </p>
                  </div>
                )}
                
                <span className="pr-10">{msg.text}</span>
                <div className={cn(
                  "absolute bottom-1 right-1.5 flex items-center gap-0.5 opacity-60 text-[8px] font-bold whitespace-nowrap",
                  isOwn ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {msg.isEdited && <span className="italic mr-0.5 font-normal">edited</span>}
                  <span>{timeStr}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side={isOwn ? "left" : "right"} 
              align="start" 
              className="bg-[#0d0d0d] border-white/10 text-white rounded-xl p-1 shadow-2xl"
            >
              <DropdownMenuItem onClick={() => onDoubleTap()} className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary"><Reply className="w-3.5 h-3.5" /> Reply</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy(msg.text)} className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary"><Copy className="w-3.5 h-3.5" /> Copy</DropdownMenuItem>
              <DropdownMenuItem onClick={onForward} className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary"><Forward className="w-3.5 h-3.5" /> Forward</DropdownMenuItem>
              {isOwn && (
                <DropdownMenuItem onClick={() => onEdit(msg)} className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>
    </div>
  );
}

function ForwardDialog({ isOpen, onOpenChange, onForward, contacts }: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/5 text-white rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold font-headline uppercase tracking-tight text-gradient">
            <Forward className="w-5 h-5 text-primary" /> Forward Message
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Choose a contact to forward this message to</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[300px] px-8 pb-8">
          <div className="space-y-1">
            {contacts?.map((contact: any) => (
              <button 
                key={contact.id} 
                onClick={() => onForward(contact)}
                className="w-full p-4 rounded-2xl hover:bg-white/5 flex items-center gap-4 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary/20 transition-colors border border-primary/20">
                  {contact.customName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{contact.customName || 'User'}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Active</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function UserProfileSidebar({ profile, contactRecord, onDismiss, otherName, initial, user, db }: any) {
  const [nickname, setNickname] = useState(contactRecord?.customName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (contactRecord) setNickname(contactRecord.customName || '');
  }, [contactRecord]);

  const handleUpdateNickname = async () => {
    if (!user || !db || !profile) return;
    setIsUpdating(true);
    try {
      const contactRef = doc(db, 'users', user.uid, 'contacts', profile.id);
      await setDoc(contactRef, {
        userId: profile.id,
        customName: nickname.trim(),
        addedAt: contactRecord?.addedAt || serverTimestamp()
      }, { merge: true });
      
      toast({ title: "Nickname Updated", description: "Identity sync complete." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not sync nickname." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDismiss} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]" />
      <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 bottom-0 w-full md:w-[350px] bg-[#0d0d0d] border-l border-white/10 z-[120] flex flex-col shadow-2xl overflow-y-auto custom-scrollbar p-8">
        <div className="flex items-center justify-between mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Secure User Profile</span>
          <Button size="icon" variant="ghost" onClick={onDismiss} className="hover:bg-white/5"><X className="w-5 h-5 text-muted-foreground" /></Button>
        </div>
        
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-primary/20 shadow-[0_0_30px_rgba(0,200,83,0.15)] bg-[#111] rounded-full flex items-center justify-center">
              <div className="text-5xl font-bold text-primary">{initial}</div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-full border-4 border-[#0d0d0d]">
              <ShieldCheck className="w-4 h-4 text-black" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-headline text-white tracking-tighter uppercase leading-none">
              {contactRecord?.customName || profile?.fullName || 'User'}
            </h2>
            {contactRecord?.customName && (
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                {profile?.fullName}
              </p>
            )}
            <p className="text-primary text-[9px] font-bold uppercase tracking-[0.2em] mt-2 bg-primary/10 py-1 px-3 rounded-full">
              Verified Identity
            </p>
          </div>

          <div className="w-full space-y-6 pt-4">
            <div className="space-y-3 text-left">
              <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary ml-1 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Manage Identity
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Set custom nickname..."
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-sm focus:ring-primary"
                />
                <Button 
                  onClick={handleUpdateNickname}
                  disabled={isUpdating}
                  className="bg-primary h-12 w-12 rounded-xl hover:glow-green shrink-0"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground font-medium italic px-1">
                Custom names only visible to you.
              </p>
            </div>

            <Card className="w-full bg-white/5 border-white/10 p-5 space-y-4 text-left rounded-2xl">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Username</p>
                <p className="text-xs text-white">@{profile?.username}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">About</p>
                <p className="text-xs text-white leading-relaxed">{profile?.about || "Digital creator on HappyChat."}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Network Identity</p>
                <p className="text-[10px] font-mono text-muted-foreground break-all">{profile?.id}</p>
              </div>
            </Card>
          </div>

          <div className="w-full pt-8 space-y-3">
             <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-destructive hover:bg-destructive/10 hover:border-destructive/30 font-bold uppercase text-[10px] tracking-widest">
               <ShieldAlert className="w-4 h-4 mr-2" /> Report User
             </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}