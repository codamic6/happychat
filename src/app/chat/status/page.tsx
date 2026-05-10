'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, arrayUnion, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Play, Pause, 
  Send, ArrowLeft, Loader2, Sparkles, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type StatusUpdate = {
  id: string;
  userId: string;
  content: string;
  type: 'text';
  createdAt: any;
  expiresAt: any;
  viewedBy?: string[];
};

export default function StatusImmersivePage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUid = searchParams.get('uid');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'contacts'));
  }, [db, user]);
  const { data: contactsData } = useCollection(contactsQuery);

  const contactIds = useMemo(() => {
    if (!user) return [];
    const ids = [user.uid];
    if (contactsData) {
      contactsData.forEach(c => ids.push(c.userId));
    }
    return ids;
  }, [contactsData, user]);

  const now = new Date();
  const statusQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'statuses'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc')
    );
  }, [db]);

  const { data: allStatuses, isLoading } = useCollection<StatusUpdate>(statusQuery);

  const userStatuses = useMemo(() => {
    if (!allStatuses || !selectedUid) return [];
    if (!contactIds.includes(selectedUid)) return [];
    return allStatuses.filter(s => s.userId === selectedUid);
  }, [allStatuses, selectedUid, contactIds]);

  const currentStatus = userStatuses[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < userStatuses.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      router.push('/chat/status');
    }
  }, [currentIndex, userStatuses.length, router]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !user || !db || !currentStatus || isSending) return;

    setIsSending(true);
    setIsPaused(true);

    try {
      const targetUid = currentStatus.userId;
      const participantIds = [user.uid, targetUid].sort();
      
      // Find or create conversation
      const convsQuery = query(
        collection(db, 'conversations'),
        where('participantIds', '==', participantIds)
      );
      const convsSnap = await getDocs(convsQuery);
      
      let conversationId;
      if (convsSnap.empty) {
        const newConv = await addDoc(collection(db, 'conversations'), {
          participantIds,
          updatedAt: serverTimestamp(),
          lastMessage: replyText,
          unreadCount: { [targetUid]: 1, [user.uid]: 0 }
        });
        conversationId = newConv.id;
      } else {
        conversationId = convsSnap.docs[0].id;
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: replyText,
          updatedAt: serverTimestamp()
        });
      }

      // Add message as a status reply
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        conversationId,
        senderId: user.uid,
        text: replyText,
        createdAt: serverTimestamp(),
        status: 'sent',
        replyTo: {
          isStatus: true,
          statusUid: targetUid,
          text: currentStatus.content,
          senderName: 'STATUS'
        }
      });

      setSendSuccess(true);
      setReplyText('');
      setTimeout(() => {
        setSendSuccess(false);
        setIsSending(false);
        setIsPaused(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Failed to send reply' });
      setIsSending(false);
      setIsPaused(false);
    }
  };

  // Track status view
  useEffect(() => {
    if (!currentStatus || !user || !db || currentStatus.userId === user.uid) return;

    if (!currentStatus.viewedBy?.includes(user.uid)) {
      const statusRef = doc(db, 'statuses', currentStatus.id);
      updateDoc(statusRef, {
        viewedBy: arrayUnion(user.uid)
      }).catch(err => console.error("Error marking status as seen:", err));
    }
  }, [currentStatus, user, db]);

  useEffect(() => {
    if (!currentStatus || isPaused) return;

    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + step;
        return next >= 100 ? 100 : next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStatus, currentIndex, isPaused]);

  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [progress, handleNext]);

  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [selectedUid]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!selectedUid || !currentStatus) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] p-12 text-center space-y-6 opacity-30 h-full">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center glow-green border border-primary/20">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-white font-headline">Select a Moment</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Secure Private Stories Active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black relative flex flex-col items-center justify-center overflow-hidden h-full sm:p-4 md:p-8">
      {/* Immersive Background Blur */}
      <div className="absolute inset-0 z-0 opacity-40 blur-[100px] scale-150 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-primary via-emerald-900 to-black" />
      </div>

      <div className={cn(
        "w-full h-full sm:h-auto sm:max-w-lg sm:aspect-[9/16] relative z-10 bg-[#0a0a0a] sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col",
        "border border-white/5"
      )}>
        {/* Progress Indicators */}
        <div className="absolute top-6 inset-x-4 flex gap-1 z-50">
          {userStatuses.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75 shadow-[0_0_8px_white]"
                style={{ 
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header */}
        <div className="absolute top-12 inset-x-4 flex items-center justify-between z-50 px-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/chat/status')} className="text-white md:hidden hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <Avatar className="w-10 h-10 border border-white/20 shadow-lg">
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {selectedUid === user?.uid ? 'Me' : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white uppercase tracking-tight font-headline truncate">Moment</p>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsPaused(!isPaused)} className="text-white/60 hover:text-white hover:bg-white/10 rounded-full">
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/chat/status')} className="text-white/60 hover:text-white hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Status Content */}
        <div className="flex-1 flex flex-col items-center justify-center relative group p-10 select-none">
          {/* Sending Feedback Overlay */}
          <AnimatePresence>
            {(isSending || sendSuccess) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] bg-black/60 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 flex items-center gap-2"
              >
                {sendSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Message Sent!</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Sending Reply...</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStatus.id} 
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }} 
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }} 
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full flex flex-col items-center justify-center text-center"
            >
              <p className="text-3xl md:text-5xl font-black font-headline text-white leading-tight tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                {currentStatus.content}
              </p>
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation Overlay Zones */}
          <div className="absolute inset-y-24 left-0 w-1/3 z-20 cursor-pointer" onClick={handlePrev} />
          <div className="absolute inset-y-24 right-0 w-1/3 z-20 cursor-pointer" onClick={handleNext} />
        </div>

        {/* Bottom Reply Bar */}
        <div className="p-8 bg-gradient-to-t from-black via-black/80 to-transparent relative z-30 pb-10">
          <div className="flex gap-2 max-w-md mx-auto items-center">
            <div className="flex-1 relative group">
              <Input 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)} 
                onFocus={() => setIsPaused(true)}
                onBlur={() => !isSending && setIsPaused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder="Reply to Moment..." 
                className="bg-white/10 border-white/10 rounded-full h-12 text-sm text-white placeholder:text-white/30 focus-visible:ring-primary focus-visible:ring-offset-0 px-6" 
              />
            </div>
            <Button 
              size="icon" 
              onClick={handleSendReply}
              disabled={!replyText.trim() || isSending}
              className="h-12 w-12 rounded-full bg-primary hover:glow-green text-primary-foreground shrink-0 active:scale-90 transition-all"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Buttons */}
      <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2">
        <Button variant="outline" size="icon" onClick={handlePrev} className="h-16 w-16 rounded-full border-white/10 bg-black/40 text-white hover:bg-primary hover:text-primary-foreground shadow-2xl transition-all">
          <ChevronLeft className="w-8 h-8" />
        </Button>
      </div>
      <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2">
        <Button variant="outline" size="icon" onClick={handleNext} className="h-16 w-16 rounded-full border-white/10 bg-black/40 text-white hover:bg-primary hover:text-primary-foreground shadow-2xl transition-all">
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
