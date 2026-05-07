
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Paperclip, Smile, Search, 
  MoreVertical, X, Info, ShieldAlert, ArrowLeft, Loader2,
  ShieldCheck, Copy, Forward, Pencil, Check, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
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
  getDocs, where, addDoc, updateDoc, increment, deleteDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  conversationParticipantIds: string[];
  isEdited?: boolean;
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
  const [inputText, setInputText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Message Actions State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);

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

  // For Forwarding
  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'contacts'));
  }, [db, user]);
  const { data: contactsData } = useCollection<ContactRecord>(contactsQuery);

  useEffect(() => {
    const uid = targetUid || conversation?.participantIds.find(id => id !== user?.uid);
    if (!uid || !db || !user) return;

    const fetchData = async () => {
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', uid)));
      if (!userDoc.empty) setOtherProfile(userDoc.docs[0].data() as UserProfile);

      const contactDoc = await getDocs(query(collection(db, 'users', user.uid, 'contacts'), where('userId', '==', uid)));
      if (!contactDoc.empty) setContactRecord(contactDoc.docs[0].data() as ContactRecord);
    };
    fetchData();
  }, [conversation, targetUid, user, db]);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !db || !otherProfile) return;
    const text = inputText;
    setInputText('');
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
      conversationParticipantIds: participantIds
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
    
    // Find or create conversation with target contact
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

  if (!otherProfile) {
    return <div className="flex-1 flex items-center justify-center bg-[#050505]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  const otherName = contactRecord?.customName || otherProfile.displayName || otherProfile.fullName || 'User';
  const initial = otherName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full relative bg-[#050505] overflow-hidden">
      {/* Header / Selection Mode Navbar */}
      <header className={cn(
        "flex-none h-16 px-4 md:px-6 border-b border-white/5 flex items-center justify-between transition-all duration-300 z-50 sticky top-0",
        selectedMessage ? "bg-primary text-primary-foreground" : "bg-black/80 backdrop-blur-3xl"
      )}>
        <AnimatePresence mode="wait">
          {selectedMessage ? (
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
                  <div className="w-9 h-9 rounded-full border border-primary/20 shadow-lg bg-[#111] flex items-center justify-center shrink-0">
                    <div className="text-sm font-bold text-primary">{initial}</div>
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{otherName}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-[8px] text-primary uppercase font-bold tracking-widest">Active</span>
                    </div>
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
                      <span className="text-xs font-bold uppercase tracking-widest">About</span>
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

      <ScrollArea className="flex-1 p-4 md:p-8 relative custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4 pb-12">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30 space-y-4">
              <ShieldCheck className="w-12 h-12 text-primary/50" />
              <p className="text-sm font-bold uppercase tracking-widest">Secure Chat Active</p>
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.senderId === user?.uid;
            const isEditing = editingMessageId === msg.id;
            const isSelected = selectedMessage?.id === msg.id;
            const timeStr = msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : '';

            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={cn("flex group/msg", isOwn ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[85%] md:max-w-[70%]", isOwn ? "items-end" : "items-start")}>
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
                      <Button variant="ghost" size="icon" onClick={() => setEditingMessageId(null)} className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground"><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onContextMenu={(e) => { e.preventDefault(); }}
                          onPointerDown={(e) => {
                            const timer = setTimeout(() => {
                              setSelectedMessage(msg);
                            }, 600);
                            e.currentTarget.addEventListener('pointerup', () => clearTimeout(timer), { once: true });
                          }}
                          className={cn(
                            "group relative p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-lg border transition-all text-left flex flex-col gap-1",
                            isOwn 
                              ? "bg-primary text-primary-foreground font-medium rounded-tr-none border-primary/20" 
                              : "bg-[#161616] text-white border-white/5 rounded-tl-none",
                            isSelected && "ring-2 ring-white/50 scale-[0.98]"
                          )}
                        >
                          <span className="pr-10">{msg.text}</span>
                          <div className={cn(
                            "absolute bottom-1.5 right-2 flex items-center gap-1 opacity-60 text-[9px] font-bold uppercase tracking-tight",
                            isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}>
                            {msg.isEdited && <span className="italic mr-1">Edited</span>}
                            <span>{timeStr}</span>
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#0d0d0d] border-white/10 text-white rounded-xl p-1 shadow-2xl">
                        <DropdownMenuItem onClick={() => handleCopy(msg.text)} className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary"><Copy className="w-3.5 h-3.5" /> Copy</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedMessage(msg); setIsForwardDialogOpen(true); }} className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary"><Forward className="w-3.5 h-3.5" /> Forward</DropdownMenuItem>
                        {isOwn && (
                          <DropdownMenuItem onClick={() => startEdit(msg)} className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </motion.div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <footer className="p-4 bg-[#0a0a0a] border-t border-white/5 sticky bottom-0">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
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

      {/* Forward Message Dialog */}
      <Dialog open={isForwardDialogOpen} onOpenChange={setIsForwardDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/5 text-white rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-headline uppercase tracking-tight text-gradient">
              <Forward className="w-5 h-5 text-primary" /> Forward Message
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Choose a contact to forward this message to</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px] px-8 pb-8">
            <div className="space-y-1">
              {contactsData?.map((contact) => (
                <button 
                  key={contact.id} 
                  onClick={() => handleForward(contact)}
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
              {contactsData?.length === 0 && (
                <div className="text-center py-12 opacity-30 space-y-2">
                  <Search className="w-8 h-8 mx-auto" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">No contacts found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfile(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 bottom-0 w-full md:w-[350px] bg-[#0d0d0d] border-l border-white/10 z-[120] flex flex-col shadow-2xl overflow-y-auto custom-scrollbar p-8">
              <div className="flex items-center justify-between mb-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">About User</span>
                <Button size="icon" variant="ghost" onClick={() => setShowProfile(false)} className="hover:bg-white/5"><X className="w-5 h-5 text-muted-foreground" /></Button>
              </div>
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-36 h-36 md:w-40 md:h-40 border-4 border-primary/20 shadow-2xl bg-[#111] rounded-full flex items-center justify-center">
                  <div className="text-5xl font-bold text-primary">{initial}</div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-headline text-white tracking-tighter uppercase">{otherName}</h2>
                  <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Verified Identity</p>
                </div>
                <Card className="w-full bg-white/5 border-white/10 p-5 space-y-4 text-left rounded-2xl shadow-lg">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">About</p>
                  <p className="text-xs text-white leading-relaxed">{otherProfile.about || "Digital creator on HappyChat."}</p>
                </Card>
                <div className="w-full pt-4 space-y-2">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest">View Media</Button>
                  <Button variant="ghost" className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest">Report User</Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
