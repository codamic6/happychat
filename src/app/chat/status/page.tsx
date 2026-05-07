
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Play, Pause, 
  Send, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type StatusUpdate = {
  id: string;
  userId: string;
  content: string;
  type: 'text';
  createdAt: any;
  expiresAt: any;
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

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'contacts'));
  }, [db, user]);
  const { data: contactsData } = useCollection(contactsQuery);

  const contactIds = useMemo(() => {
    if (!user) return [];
    const ids = [user.uid];
    if (contactsData) {
      contactsData.forEach(c => ids.push(c.id));
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
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] p-12 text-center space-y-6 opacity-30">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center glow-green border border-primary/20">
          <Play className="w-12 h-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-white font-headline">Select a Moment</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Secure Private Stories Active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black relative flex flex-col items-center justify-center overflow-hidden h-full">
      <div className="absolute inset-0 z-0 opacity-40 blur-3xl scale-150">
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-emerald-900/30" />
      </div>

      <div className="w-full max-w-lg h-full max-h-[90vh] md:aspect-[9/16] relative z-10 bg-[#0d0d0d] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
        <div className="absolute top-6 inset-x-4 flex gap-1 z-50">
          {userStatuses.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{ 
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-12 inset-x-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/chat/status')} className="text-white md:hidden"><ArrowLeft className="w-6 h-6" /></Button>
            <Avatar className="w-10 h-10 border border-white/20">
              <AvatarFallback className="bg-primary/20 text-primary">U</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-tight font-headline">Viewing Moment</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Live</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsPaused(!isPaused)} className="text-white/60 hover:text-white">{isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}</Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/chat/status')} className="text-white/60 hover:text-white"><X className="w-6 h-6" /></Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative group p-6">
          <AnimatePresence mode="wait">
            <motion.div key={currentStatus.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full h-full flex flex-col items-center justify-center">
              <div className="text-center space-y-6 px-4">
                <p className="text-3xl md:text-4xl font-bold font-headline text-white leading-tight tracking-tighter">
                  {currentStatus.content}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-y-24 left-0 w-1/3 z-20" onClick={handlePrev} />
          <div className="absolute inset-y-24 right-0 w-1/3 z-20" onClick={handleNext} />
        </div>

        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent relative z-30">
          <div className="flex gap-2 max-w-md mx-auto">
            <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Send a reply..." className="bg-white/10 border-white/20 rounded-full h-12 text-sm text-white focus-visible:ring-primary" />
            <Button size="icon" className="h-12 w-12 rounded-full bg-primary hover:glow-green text-primary-foreground shrink-0"><Send className="w-5 h-5" /></Button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 space-y-4">
        <Button variant="outline" size="icon" onClick={handlePrev} className="h-12 w-12 rounded-full border-white/10 bg-black/40 text-white hover:bg-primary hover:text-primary-foreground"><ChevronLeft className="w-6 h-6" /></Button>
      </div>
      <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 space-y-4">
        <Button variant="outline" size="icon" onClick={handleNext} className="h-12 w-12 rounded-full border-white/10 bg-black/40 text-white hover:bg-primary hover:text-primary-foreground"><ChevronRight className="w-6 h-6" /></Button>
      </div>
    </div>
  );
}
