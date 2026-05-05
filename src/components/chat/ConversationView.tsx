'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Paperclip, Smile, Search, 
  MoreVertical, X, Info, ShieldCheck, Mail, Phone, ArrowLeft, Loader2,
  ShieldAlert, UserCheck
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
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { 
  doc, query, collection, serverTimestamp, setDoc, 
  getDocs, where, addDoc, updateDoc, increment
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  conversationParticipantIds: string[];
};

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  email: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  about?: string;
};

type Conversation = {
  id: string;
  participantIds: string[];
  unreadCount?: Record<string, number>;
};

export function ConversationView({ conversationId }: { conversationId: string }) {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const uid = targetUid || conversation?.participantIds.find(id => id !== user?.uid);
    if (!uid || !db) return;

    const fetchProfile = async () => {
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', uid)));
      if (!userDoc.empty) {
        setOtherProfile(userDoc.docs[0].data() as UserProfile);
      }
    };
    fetchProfile();
  }, [conversation, targetUid, user, db]);

  useEffect(() => {
    if (conversation && user && db && conversation.unreadCount?.[user.uid] && conversation.unreadCount[user.uid] > 0) {
      updateDoc(doc(db, 'conversations', conversationId), {
        [`unreadCount.${user.uid}`]: 0
      });
    }
  }, [conversation, user, db, conversationId]);

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
    let participantIds = conversation?.participantIds || [user.uid, otherProfile.id].sort();

    if (isNewChat) {
      const existingQ = query(
        collection(db, 'conversations'),
        where('participantIds', '==', participantIds)
      );
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

  if (!otherProfile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const otherName = otherProfile.displayName || otherProfile.fullName || 'User';
  const initials = (otherProfile.displayName || otherProfile.fullName || 'U').charAt(0).toUpperCase();
  const otherAvatar = otherProfile.profileImageUrl?.includes('mega.nz') ? `/api/avatar/${otherProfile.id}?t=${Date.now()}` : null;

  return (
    <div className="flex-1 flex overflow-hidden h-full flex-col relative bg-[#050505]">
      {/* Fixed Header */}
      <header className="h-16 px-4 md:px-6 border-b border-white/5 flex items-center justify-between bg-black/80 backdrop-blur-3xl sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden text-muted-foreground hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={() => setShowProfile(true)}>
            <div className="w-9 h-9 rounded-full border border-primary/20 shadow-lg overflow-hidden shrink-0 flex items-center justify-center bg-[#111]">
               {otherAvatar ? (
                 <img 
                    src={otherAvatar} 
                    className="w-full h-full object-cover" 
                    alt={otherName} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = "w-full h-full flex items-center justify-center text-sm font-bold text-primary";
                        fallback.innerText = initials;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
               ) : (
                 <div className="text-sm font-bold text-primary">{initials}</div>
               )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                {otherName}
              </h3>
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
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0d0d0d] border-white/10 text-white rounded-2xl p-1 shadow-2xl">
              <DropdownMenuItem onClick={() => setShowProfile(true)} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 rounded-xl">
                <Info className="w-4 h-4 text-primary" /> <span className="text-xs font-bold uppercase tracking-widest">About</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-destructive/10 text-destructive rounded-xl">
                <ShieldAlert className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Block</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Message Feed */}
      <ScrollArea className="flex-1 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-fixed opacity-[0.98]">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4 pb-12">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30 space-y-4">
              <ShieldCheck className="w-12 h-12 text-primary/50" />
              <p className="text-sm font-bold uppercase tracking-widest text-center">Chat with {otherName}</p>
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.senderId === user?.uid;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] md:max-w-[60%] space-y-1", isOwn ? "items-end" : "items-start")}>
                  <div className={cn("p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-lg border", isOwn ? "bg-primary text-primary-foreground font-medium rounded-tr-none border-primary/20" : "bg-white/5 text-white border-white/10 rounded-tl-none")}>
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">
                      {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : ''}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Fixed Message Input */}
      <footer className="p-4 bg-[#0a0a0a] border-t border-white/5 shrink-0 z-40">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white shrink-0 bg-white/5 rounded-xl h-11 w-11">
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Write a message...`}
              className="bg-white/5 border-white/10 h-11 pl-4 pr-12 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 text-sm"
            />
            <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary h-8 w-8">
              <Smile className="w-5 h-5" />
            </Button>
          </div>
          <Button onClick={handleSendMessage} disabled={!inputText.trim()} className="bg-primary hover:glow-green-bright text-primary-foreground h-11 w-11 rounded-xl shadow-xl transition-all">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>

      {/* Profile Sidebar */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfile(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed right-0 top-0 bottom-0 w-full md:w-[350px] bg-[#0d0d0d] border-l border-white/10 z-[120] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-8 flex flex-col h-full relative overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">About User</span>
                  <Button size="icon" variant="ghost" onClick={() => setShowProfile(false)} className="h-9 w-9 rounded-full"><X className="w-5 h-5" /></Button>
                </div>
                <div className="flex flex-col items-center text-center space-y-8">
                  <div className="w-36 h-36 md:w-40 md:h-40 border-4 border-primary/20 shadow-2xl bg-[#111] rounded-full overflow-hidden flex items-center justify-center">
                    {otherAvatar ? (
                      <img 
                        src={otherAvatar} 
                        className="w-full h-full object-cover" 
                        alt={otherName} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = "w-full h-full flex items-center justify-center text-5xl font-bold text-primary";
                            fallback.innerText = initials;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="text-5xl font-bold text-primary">{initials}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold font-headline tracking-tight text-white">{otherName}</h2>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Verified Identity</p>
                  </div>
                  <Card className="w-full bg-white/5 border-white/10 p-5 space-y-5 text-left rounded-2xl backdrop-blur-xl">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">About</p>
                        <p className="text-xs text-white leading-relaxed">{otherProfile.about || "No bio available."}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                        <p className="text-xs text-white truncate">{otherProfile.email}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
