
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, Smile, Search, 
  MoreVertical, X, Info, ShieldCheck, Mail, Phone, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { 
  doc, query, collection, orderBy, limit, serverTimestamp, setDoc, 
  getDocs, where, addDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
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
};

export function ConversationView({ conversationId }: { conversationId: string }) {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch conversation meta
  const convRef = useMemoFirebase(() => doc(db, 'conversations', conversationId), [db, conversationId]);
  const { data: conversation } = useDoc<Conversation>(convRef);

  // Fetch messages
  const msgQuery = useMemoFirebase(() => {
    if (!db || !conversationId) return null;
    return query(collection(db, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'), limit(100));
  }, [db, conversationId]);
  const { data: messages, isLoading: isMessagesLoading } = useCollection<Message>(msgQuery);

  // Fetch other participant profile
  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!conversation || !user || !db) return;
    const otherId = conversation.participantIds.find(id => id !== user.uid);
    if (!otherId) return;

    const fetchProfile = async () => {
      const q = query(collection(db, 'users'), where('id', '==', otherId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setOtherProfile(snap.docs[0].data() as UserProfile);
      }
    };
    fetchProfile();
  }, [conversation, user, db]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !db || !conversation) return;
    const text = inputText;
    setInputText('');

    const msgData = {
      text,
      senderId: user.uid,
      timestamp: serverTimestamp(),
      conversationParticipantIds: conversation.participantIds
    };

    // Add message
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), msgData);
    
    // Update conversation last message
    await setDoc(doc(db, 'conversations', conversationId), {
      lastMessage: text,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  if (!otherProfile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 md:px-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar 
              className="w-8 h-8 md:w-10 md:h-10 border border-primary/20 cursor-pointer"
              onClick={() => setShowProfile(true)}
            >
              <AvatarImage src={otherProfile.profileImageUrl} />
              <AvatarFallback>{otherProfile.fullName[0]}</AvatarFallback>
            </Avatar>
            <div className="cursor-pointer overflow-hidden" onClick={() => setShowProfile(true)}>
              <h3 className="text-sm font-bold text-white truncate">{otherProfile.fullName}</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] md:text-[10px] text-primary uppercase font-black tracking-widest">Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-3">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Search className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4 md:p-6 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-fixed opacity-[0.98]">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-center py-8">
               <div className="px-4 py-1.5 rounded-full glass border border-white/5 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                 Encryption Phase Active
               </div>
            </div>

            {messages?.map((msg) => {
              const isOwn = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[70%] space-y-1",
                    isOwn ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-3 md:p-4 rounded-2xl text-sm leading-relaxed relative overflow-hidden",
                      isOwn 
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-none glow-green" 
                        : "bg-white/5 text-white border border-white/10 rounded-tl-none backdrop-blur-md"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] font-black text-muted-foreground uppercase px-1">
                      {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : ''}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <footer className="p-4 md:p-6 bg-[#0a0a0a] border-t border-white/5 backdrop-blur-xl relative z-10">
          <div className="flex items-center gap-3 md:gap-4 max-w-5xl mx-auto">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white shrink-0"><Paperclip className="w-5 h-5" /></Button>
            <div className="flex-1 relative">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message ${otherProfile.fullName.split(' ')[0]}...`}
                className="bg-[#111] border-white/10 h-12 md:h-14 pl-5 pr-14 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all text-sm"
              />
              <Button size="icon" variant="ghost" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"><Smile className="w-5 h-5" /></Button>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="bg-primary hover:glow-green-bright text-primary-foreground h-12 w-12 md:h-14 md:w-14 rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-80 bg-[#0a0a0a] border-l border-white/5 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">User Descriptor</h3>
                  <Button size="icon" variant="ghost" onClick={() => setShowProfile(false)} className="h-8 w-8 rounded-full"><X className="w-4 h-4" /></Button>
                </div>

                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-2xl">
                      <AvatarImage src={otherProfile.profileImageUrl} />
                      <AvatarFallback className="text-4xl">{otherProfile.fullName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-primary rounded-full border-4 border-[#0a0a0a] glow-green" />
                  </div>
                  
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black font-headline italic tracking-tighter uppercase">{otherProfile.fullName}</h2>
                    <p className="text-primary text-[8px] font-black uppercase tracking-[0.4em]">Verified Instance</p>
                  </div>

                  <Card className="w-full bg-white/5 border-white/5 p-4 space-y-4 text-left">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Info className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">About</p>
                          <p className="text-xs text-white italic truncate">{otherProfile.about || "Digital creator on HappyChat."}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Secure Line</p>
                          <p className="text-xs text-white">{otherProfile.phoneNumber || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Mail className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Identifier</p>
                          <p className="text-xs text-white truncate">{otherProfile.email}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="w-full pt-8 space-y-4">
                     <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter text-muted-foreground px-1">
                       <span>Identity Integrity</span>
                       <span className="text-primary">SECURE</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.5 }}
                          className="h-full bg-primary glow-green" 
                        />
                     </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 flex justify-center gap-8">
                   <div className="flex flex-col items-center gap-2">
                     <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all cursor-pointer border border-white/5">
                       <ShieldCheck className="w-5 h-5" />
                     </div>
                     <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Seal</span>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                     <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-all cursor-pointer border border-white/5">
                       <X className="w-5 h-5" />
                     </div>
                     <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Ban</span>
                   </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
