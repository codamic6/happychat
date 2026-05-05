
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, Smile, Search, 
  MoreVertical, X, Info, ShieldCheck, Mail, Phone, ArrowLeft, Loader2,
  Trash2, ShieldAlert, UserCheck
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
  doc, query, collection, limit, serverTimestamp, setDoc, 
  getDocs, where, addDoc 
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
};

export function ConversationView({ conversationId }: { conversationId: string }) {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const convRef = useMemoFirebase(() => {
    if (!db || !conversationId) return null;
    return doc(db, 'conversations', conversationId);
  }, [db, conversationId]);
  const { data: conversation } = useDoc<Conversation>(convRef);

  const msgQuery = useMemoFirebase(() => {
    if (!db || !conversationId || !user) return null;
    return query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('conversationParticipantIds', 'array-contains', user.uid),
      limit(100)
    );
  }, [db, conversationId, user]);
  
  const { data: rawMessages } = useCollection<Message>(msgQuery);

  const messages = React.useMemo(() => {
    if (!rawMessages) return null;
    return [...rawMessages].sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return timeA - timeB;
    });
  }, [rawMessages]);

  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!conversation || !user || !db) return;
    const otherId = conversation.participantIds.find(id => id !== user.uid);
    if (!otherId) return;

    const fetchProfile = async () => {
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', otherId)));
      if (!userDoc.empty) {
        setOtherProfile(userDoc.docs[0].data() as UserProfile);
      }
    };
    fetchProfile();
  }, [conversation, user, db]);

  useEffect(() => {
    if (scrollRef.current && messages) {
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

    addDoc(collection(db, 'conversations', conversationId, 'messages'), msgData);
    
    setDoc(doc(db, 'conversations', conversationId), {
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
    <div className="flex-1 flex overflow-hidden h-full flex-col relative bg-[#050505]">
      {/* Native-style Sticky Header */}
      <header className="h-16 md:h-20 px-4 md:px-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-3xl sticky top-0 z-40">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/chat')} 
            className="md:hidden text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div 
            className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" 
            onClick={() => setShowProfile(true)}
          >
            <Avatar className="w-10 h-10 border border-primary/20 group-hover:scale-105 transition-transform shadow-lg">
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
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0d0d0d] border-white/10 text-white rounded-2xl overflow-hidden p-1 shadow-2xl">
              <DropdownMenuItem onClick={() => setShowProfile(true)} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 rounded-xl transition-all">
                <Info className="w-4 h-4 text-primary" /> <span className="text-xs font-bold uppercase tracking-widest">About Identity</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 rounded-xl transition-all">
                <Search className="w-4 h-4 text-primary" /> <span className="text-xs font-bold uppercase tracking-widest">Search Channel</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-destructive/10 text-destructive rounded-xl transition-all">
                <ShieldAlert className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Block Signal</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Message Stream */}
      <ScrollArea className="flex-1 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-fixed opacity-[0.98]">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 md:pb-32">
          <div className="flex justify-center py-4">
             <div className="px-5 py-2 rounded-full glass border border-primary/20 text-[9px] font-black uppercase tracking-[0.2em] text-primary glow-green">
               Encrypted Neural Link
             </div>
          </div>

          {messages?.map((msg) => {
            const isOwn = msg.senderId === user?.uid;
            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn("flex group", isOwn ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[85%] md:max-w-[65%] space-y-1 relative",
                  isOwn ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed shadow-xl border transition-all duration-300",
                    isOwn 
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-none border-primary/20 glow-green" 
                      : "bg-white/5 text-white border-white/10 rounded-tl-none backdrop-blur-xl"
                  )}>
                    {msg.text}
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    isOwn ? "flex-row-reverse" : "flex-row"
                  )}>
                    <span className="text-[9px] font-black text-muted-foreground uppercase">
                      {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : 'Syncing'}
                    </span>
                    {isOwn && <UserCheck className="w-3 h-3 text-primary" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Sticky Message Composer */}
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
              placeholder={`Communicate with @${otherProfile.username}...`}
              className="bg-white/5 border-white/10 h-12 md:h-14 pl-5 pr-14 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all text-sm md:text-base shadow-inner"
            />
            <Button size="icon" variant="ghost" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
              <Smile className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="bg-primary hover:glow-green-bright text-primary-foreground h-12 w-12 md:h-14 md:w-14 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
      </footer>

      {/* Holographic User Profile Panel */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-[#0d0d0d] border-l border-white/10 z-[70] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="p-8 flex flex-col h-full relative overflow-y-auto">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-primary w-5 h-5" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Identity Profile</h3>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setShowProfile(false)} className="h-10 w-10 rounded-full hover:bg-white/5 transition-all">
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="flex flex-col items-center text-center space-y-8">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all animate-pulse" />
                    <Avatar className="w-40 h-40 md:w-48 md:h-48 border-4 border-primary/20 shadow-2xl relative z-10">
                      <AvatarImage src={otherProfile.profileImageUrl} />
                      <AvatarFallback className="text-6xl font-black bg-[#111]">{otherProfile.fullName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-4 right-4 w-8 h-8 bg-primary rounded-full border-4 border-[#0d0d0d] glow-green z-20" />
                  </div>
                  
                  <div className="space-y-2 relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black font-headline italic tracking-tighter uppercase text-gradient">{otherProfile.fullName}</h2>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Neural Signature Active</p>
                  </div>

                  <Card className="w-full bg-white/5 border-white/10 p-6 space-y-6 text-left rounded-3xl backdrop-blur-xl">
                    <div className="space-y-6">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <Info className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Descriptor</p>
                          <p className="text-sm text-white italic">{otherProfile.about || "Digital identity encrypted by HappyChat Protocol."}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Secure Line</p>
                          <p className="text-sm text-white">{otherProfile.phoneNumber || "ID: Undisclosed"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Global Identifier</p>
                          <p className="text-sm text-white truncate">{otherProfile.email}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="w-full space-y-6 pt-4">
                     <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tighter text-muted-foreground px-1">
                       <span>Encryption Integrity</span>
                       <span className="text-primary">100% SECURE</span>
                     </div>
                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 2, ease: "easeOut" }}
                          className="h-full bg-primary glow-green rounded-full shadow-[0_0_15px_rgba(0,200,83,0.5)]" 
                        />
                     </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 flex justify-center gap-10">
                   <div className="flex flex-col items-center gap-3 group cursor-pointer">
                     <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300 border border-white/10 shadow-lg">
                       <ShieldCheck className="w-6 h-6" />
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Verify</span>
                   </div>
                   <div className="flex flex-col items-center gap-3 group cursor-pointer">
                     <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-destructive/20 group-hover:text-destructive transition-all duration-300 border border-white/10 shadow-lg">
                       <ShieldAlert className="w-6 h-6" />
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-destructive transition-colors">Terminate</span>
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
