
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, MoreHorizontal, Smile, Search, 
  MoreVertical, X, Info, ShieldAlert, ArrowLeft, Loader2,
  ShieldCheck, Copy, Pencil, Check, Reply, Save,
  CheckCheck, Tag, Trash2, BarChart2, UserPlus, MessageSquare,
  Forward, ChevronRight
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
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
  orderBy, limit, arrayUnion
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
    id: string;
    text: string;
    senderId: string;
    senderName: string;
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
};

export function ConversationView({ conversationId }: { conversationId: string }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [inputText, setInputText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [isPollDialogOpen, setIsPollDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
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
    if (!db || isNewChat || !user || isUserLoading) return;
    const typingRef = doc(db, 'conversations', conversationId);
    updateDoc(typingRef, { [`typing.${user.uid}`]: inputText.trim().length > 0 }).catch(() => {});
  }, [inputText, db, conversationId, isNewChat, user, isUserLoading]);

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

    let activeId = conversationId;
    let pIds = (conversation?.participantIds || [user.uid, otherProfile.id]).sort();

    if (isNewChat) {
      const existing = await getDocs(query(collection(db, 'conversations'), where('participantIds', '==', pIds)));
      if (existing.empty) {
        const newConv = await addDoc(collection(db, 'conversations'), {
          participantIds: pIds,
          updatedAt: serverTimestamp(),
          lastMessage: text || 'Media Shared',
          unreadCount: { [otherProfile.id]: 1, [user.uid]: 0 }
        });
        activeId = newConv.id;
        router.replace(`/chat/${activeId}`);
      } else {
        activeId = existing.docs[0].id;
        router.replace(`/chat/${activeId}`);
      }
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
      [`unreadCount.${otherProfile.id}`]: increment(1)
    }).catch(() => {});
  };

  const deleteMessage = async (msgId: string, senderId: string, mode: 'me' | 'everyone') => {
    if (!user || !db) return;
    const ref = doc(db, 'conversations', conversationId, 'messages', msgId);
    if (mode === 'me') {
      updateDoc(ref, { deletedFor: arrayUnion(user.uid) });
    } else if (mode === 'everyone' && senderId === user.uid) {
      updateDoc(ref, { isDeleted: true, text: 'This message was deleted', poll: null, sharedContact: null });
    }
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

  const mainName = contactRecord?.customName || otherProfile?.displayName || otherProfile?.fullName || 'User';
  const initial = mainName.charAt(0).toUpperCase();

  return (
    <div className="flex-1 flex flex-col relative bg-[#050505] overflow-hidden">
      <header className="flex-none h-16 px-4 border-b border-white/5 flex items-center justify-between z-50 sticky top-0 bg-black/80 backdrop-blur-3xl">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden text-muted-foreground"><ArrowLeft className="w-6 h-6" /></Button>
          <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={() => setShowProfile(true)}>
            <div className="w-10 h-10 rounded-full border border-primary/20 bg-[#111] flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-sm font-bold text-primary">{initial}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{mainName}</h3>
              <p className="text-[10px] text-primary uppercase font-bold tracking-widest">{otherProfile?.isOnline ? 'Online' : 'Offline'}</p>
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-2 pb-12">
          {messages.map((msg) => (
            <MessageRow 
              key={msg.id} msg={msg} user={user} isMobile={isMobile}
              onVote={(idx) => handleVote(msg, idx)}
              onDelete={(mode) => deleteMessage(msg.id, msg.senderId, mode)}
              onReply={() => setReplyingTo(msg)}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <footer className="bg-[#0a0a0a] border-t border-white/5 p-4 sticky bottom-0">
        <AnimatePresence>
          {replyingTo && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 py-2 bg-white/5 border-l-2 border-primary mb-2 flex justify-between items-center rounded-r-xl">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-primary uppercase">Replying to {replyingTo.senderId === user?.uid ? 'You' : 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{replyingTo.text}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-6 w-6"><X className="w-4 h-4" /></Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="bg-white/5 rounded-xl h-11 w-11"><MoreHorizontal className="w-5 h-5 text-muted-foreground" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 bg-[#0d0d0d] border-white/10 p-2 rounded-2xl shadow-2xl">
              <Dialog open={isPollDialogOpen} onOpenChange={setIsPollDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/10 text-white">
                    <BarChart2 className="w-4 h-4 text-primary" /> <span className="text-xs font-bold uppercase tracking-widest">Create Poll</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <PollComposer onCreated={(p) => { handleSendMessage({ poll: p }); setIsPollDialogOpen(false); }} />
              </Dialog>
              
              <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/10 text-white">
                    <UserPlus className="w-4 h-4 text-primary" /> <span className="text-xs font-bold uppercase tracking-widest">Share Contact</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <ContactPicker onPicked={(c) => { handleSendMessage({ sharedContact: c }); setIsContactDialogOpen(false); }} currentUserId={user?.uid} />
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 relative">
            <Input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Write a message..." className="bg-white/5 border-white/10 h-11 rounded-xl focus:ring-primary" />
          </div>
          <Button onClick={() => handleSendMessage()} disabled={!inputText.trim()} className="bg-primary hover:glow-green text-primary-foreground h-11 w-11 rounded-xl active:scale-95 transition-all"><Send className="w-5 h-5" /></Button>
        </div>
      </footer>
    </div>
  );
}

function MessageRow({ msg, user, isMobile, onVote, onDelete, onReply }: any) {
  const isOwn = msg.senderId === user?.uid;
  const isSystem = msg.isDeleted;

  return (
    <div className={cn("flex w-full group", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] md:max-w-[70%] p-3 rounded-2xl text-xs relative group",
        isSystem ? "bg-white/5 text-muted-foreground italic border border-white/5 text-center px-8" : 
        isOwn ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-[#161616] text-white rounded-tl-none border border-white/5"
      )}>
        {msg.replyTo && (
          <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-primary text-[10px] opacity-80 truncate">
            {msg.replyTo.text}
          </div>
        )}

        {msg.text && <p className="mb-1">{msg.text}</p>}

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
                    <span>{opt}</span>
                    <span className="flex items-center gap-1">{votes.length} {hasVoted && <Check className="w-3 h-3 text-primary" />}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {msg.sharedContact && (
          <div className="mt-2 bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg">{msg.sharedContact.name.charAt(0)}</div>
            <div className="text-center">
              <p className="font-bold text-[10px] uppercase tracking-widest">{msg.sharedContact.name}</p>
              <p className="text-[9px] text-muted-foreground">@{msg.sharedContact.username}</p>
            </div>
            <Button size="sm" variant="secondary" className="w-full h-8 text-[8px] font-bold uppercase tracking-widest bg-white/5 hover:bg-primary/20 hover:text-primary">
              <MessageSquare className="w-3 h-3 mr-2" /> Message
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-1 items-center mt-1 text-[8px] font-black uppercase">
          <span className="opacity-60">{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : ''}</span>
          {isOwn && !isSystem && (
            <div className="flex items-center ml-1">
              {msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-sky-400 stroke-[3.5]" /> : <Check className="w-3.5 h-3.5 text-white/40" />}
            </div>
          )}
        </div>

        {!isSystem && (
          <div className={cn(
            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10",
            isOwn ? "-left-10" : "-right-10"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 text-white"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#111] border-white/10 text-white min-w-[160px] rounded-xl shadow-2xl">
                <DropdownMenuItem onClick={onReply} className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary p-2 text-[10px] uppercase font-bold tracking-widest">
                  <Reply className="w-3 h-3" /> Reply
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary p-2 text-[10px] uppercase font-bold tracking-widest">
                  <Forward className="w-3 h-3" /> Forward
                </DropdownMenuItem>
                {isOwn && (
                  <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary p-2 text-[10px] uppercase font-bold tracking-widest">
                    <Pencil className="w-3 h-3" /> Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 cursor-pointer focus:bg-destructive/20 focus:text-destructive p-2 text-[10px] uppercase font-bold tracking-widest">
                    <Trash2 className="w-3 h-3 text-destructive" /> Delete
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-[#111] border-white/10 text-white min-w-[160px] rounded-xl shadow-2xl">
                    <DropdownMenuItem onClick={() => onDelete('me')} className="gap-2 cursor-pointer focus:bg-destructive/20 focus:text-destructive p-2 text-[10px] uppercase font-bold tracking-widest">
                      Delete for Me
                    </DropdownMenuItem>
                    {isOwn && (
                      <DropdownMenuItem onClick={() => onDelete('everyone')} className="gap-2 cursor-pointer focus:bg-destructive/20 focus:text-destructive p-2 text-[10px] uppercase font-bold tracking-widest">
                        Delete for Everyone
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

function PollComposer({ onCreated }: { onCreated: (poll: any) => void }) {
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
    <DialogContent className="bg-[#0a0a0a] border-white/5 text-white p-6 rounded-[2rem]">
      <DialogHeader>
        <DialogTitle className="text-xl font-headline uppercase tracking-tight flex items-center gap-2 text-gradient">
          <BarChart2 className="w-6 h-6 text-primary" /> Create Poll
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Question</Label>
          <Input 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            placeholder="Ask something..." 
            className="bg-white/5 border-white/10 h-12 text-sm focus:ring-primary" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Options</Label>
          {options.map((opt, i) => (
            <Input 
              key={i} 
              value={opt} 
              onChange={(e) => handleOptionChange(i, e.target.value)} 
              placeholder={`Option ${i+1}`} 
              className="bg-white/5 border-white/10 h-10 text-sm focus:ring-primary" 
            />
          ))}
          <Button variant="ghost" onClick={handleAddOption} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10">Add Option +</Button>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onCreated({ question, options, votes: {} })} disabled={isInvalid} className="w-full h-12 bg-primary hover:glow-green uppercase font-bold tracking-widest text-primary-foreground">Share Poll</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ContactPicker({ onPicked, currentUserId }: any) {
  const db = useFirestore();
  const contactsQuery = useMemoFirebase(() => currentUserId && db ? query(collection(db, 'users', currentUserId, 'contacts')) : null, [db, currentUserId]);
  const { data: contacts } = useCollection<ContactRecord>(contactsQuery);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

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

  return (
    <DialogContent className="bg-[#0a0a0a] border-white/5 text-white p-6 rounded-[2rem]">
      <DialogHeader><DialogTitle className="text-xl font-headline uppercase tracking-tight flex items-center gap-2 text-gradient"><UserPlus className="w-6 h-6 text-primary" /> Share Contact</DialogTitle></DialogHeader>
      <ScrollArea className="h-[300px] mt-4">
        <div className="space-y-1">
          {profiles.map(p => (
            <button key={p.id} onClick={() => onPicked({ uid: p.id, name: p.fullName || p.displayName, username: p.username })} className="w-full p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all text-left">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{p.fullName?.charAt(0)}</div>
              <div><p className="font-bold text-xs text-white">{p.fullName}</p><p className="text-[10px] text-muted-foreground uppercase tracking-widest">@{p.username}</p></div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
