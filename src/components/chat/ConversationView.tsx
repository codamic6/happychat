
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Paperclip, Smile, Search, 
  MoreVertical, X, Info, ShieldCheck, Mail, Phone, ArrowLeft, Loader2,
  ShieldAlert, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  profileImageUrl: string;
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
    // Query without orderBy to avoid index/permission errors during initial setup
    return query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('conversationParticipantIds', 'array-contains', user.uid)
    );
  }, [db, conversationId, isNewChat, user]);
  
  const { data: rawMessages } = useCollection<Message>(msgQuery);

  // Sort messages manually in memory by timestamp asc
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

  return (
    <div className="flex-1 flex overflow-hidden h-full flex-col relative bg-[#050505]">
      <header className="h-16 md:h-20 px-4 md:px-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-3xl sticky top-0 z-40">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden text-muted-foreground hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={() => setShowProfile(true)}>
            <Avatar className="w-10 h-10 border border-primary/20 shadow-lg">
              <AvatarImage src={otherProfile.profileImageUrl} />
              <AvatarFallback className="bg-white/5 font-black">{otherProfile.fullName[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-bold text-white truncate group-hover:text-primary transition-colors">
                {otherProfile.fullName}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] md:text-[10px] text-primary uppercase font-black tracking-widest">Signal Active</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-3">
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Search className="w-5 h-5" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0d0d0d] border-white/10 text-white rounded-2xl overflow-hidden p-1 shadow-2xl">
              <DropdownMenuItem onClick={() => setShowProfile(true)} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 rounded-xl">
                <Info className="w-4 h-4 text-primary" /> <span className="text-xs font-bold uppercase tracking-widest">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-destructive/10 text-destructive rounded-xl">
                <ShieldAlert className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Block</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ScrollArea className="flex-1 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-fixed opacity-[0.98]">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 md:pb-32">
          <div className="flex justify-center py-4">
             <div className="px-5 py-2 rounded-full glass border border-primary/20 text-[9px] font-black uppercase tracking-[0.2em] text-primary glow-green">
               E2E Neural Encryption Enabled
             </div>
          </div>

          {messages.map((msg) => {
            const isOwn = msg.senderId === user?.uid;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("flex group", isOwn ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] md:max-w-[65%] space-y-1 relative", isOwn ? "items-end" : "items-start")}>
                  <div className={cn("p-4 rounded-2xl text-sm leading-relaxed shadow-xl border transition-all", isOwn ? "bg-primary text-primary-foreground font-medium rounded-tr-none border-primary/20 glow-green" : "bg-white/5 text-white border-white/10 rounded-tl-none backdrop-blur-xl")}>
                    {msg.text}
                  </div>
                  <div className={cn("flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity", isOwn ? "flex-row-reverse" : "flex-row")}>
                    <span className="text-[9px] font-black text-muted-foreground uppercase">
                      {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                    </span>
                    {isOwn && <UserCheck className="w-3 h-3 text-primary" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {messages.length === 0 && !isNewChat && (
            <div className="flex flex-col items-center justify-center h-full opacity-20 pt-20">
              <ShieldCheck className="w-16 h-16 text-primary mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">Secure session established</p>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <footer className="p-4 md:p-6 bg-[#0a0a0a]/90 backdrop-blur-3xl border-t border-white/5 sticky bottom-0 z-40 pb-safe">
        <div className="flex items-center gap-3 md:gap-4 max-w-5xl mx-auto">
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white shrink-0 bg-white/5 rounded-2xl h-12 w-12 md:h-14 md:w-14">
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Write to @${otherProfile.username}...`}
              className="bg-white/5 border-white/10 h-12 md:h-14 pl-5 pr-14 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0 text-sm md:text-base"
            />
            <Button size="icon" variant="ghost" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
              <Smile className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
          <Button onClick={handleSendMessage} disabled={!inputText.trim()} className="bg-primary hover:glow-green-bright text-primary-foreground h-12 w-12 md:h-14 md:w-14 rounded-2xl shadow-xl transition-all active:scale-95">
            <Send className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
      </footer>

      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfile(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-[#0d0d0d] border-l border-white/10 z-[70] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-8 flex flex-col h-full relative overflow-y-auto">
                <div className="flex items-center justify-between mb-12">
                  <ShieldCheck className="text-primary w-5 h-5" />
                  <Button size="icon" variant="ghost" onClick={() => setShowProfile(false)} className="h-10 w-10 rounded-full"><X className="w-6 h-6" /></Button>
                </div>
                <div className="flex flex-col items-center text-center space-y-8">
                  <Avatar className="w-40 h-40 md:w-48 md:h-48 border-4 border-primary/20 shadow-2xl relative z-10">
                    <AvatarImage src={otherProfile.profileImageUrl} />
                    <AvatarFallback className="text-6xl font-black bg-[#111]">{otherProfile.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-black font-headline italic tracking-tighter uppercase text-gradient">{otherProfile.fullName}</h2>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">Neural Verified</p>
                  </div>
                  <Card className="w-full bg-white/5 border-white/10 p-6 space-y-6 text-left rounded-3xl backdrop-blur-xl">
                    <div className="space-y-6">
                      <div className="flex items-center gap-5">
                        <Info className="w-5 h-5 text-primary" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">About</p>
                          <p className="text-sm text-white italic">{otherProfile.about || "Digital creator using HappyChat."}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <Phone className="w-5 h-5 text-primary" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Secure Line</p>
                          <p className="text-sm text-white">{otherProfile.phoneNumber || "ID: Protected"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <Mail className="w-5 h-5 text-primary" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                          <p className="text-sm text-white truncate">{otherProfile.email}</p>
                        </div>
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
