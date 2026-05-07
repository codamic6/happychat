
'use client';

import React, { useState } from 'react';
import { 
  Type, Send, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function StatusComposer({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [inputText, setInputText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!user || !db || isPosting || !inputText.trim()) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'statuses'), {
        userId: user.uid,
        content: inputText.trim(),
        type: 'text',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      toast({ title: "Moment Shared", description: "Your status is now live for 24 hours." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Post Failed', description: err.message });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/5 text-white p-0 overflow-hidden rounded-[2.5rem] max-h-[90vh] flex flex-col">
      <DialogHeader className="p-6 pb-2 shrink-0">
        <DialogTitle className="text-2xl font-bold font-headline uppercase tracking-tight text-gradient">
          Share a Moment
        </DialogTitle>
        <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Vanish in 24 hours
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 pb-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        <div className="relative aspect-[4/5] bg-white/5 rounded-3xl overflow-hidden group shrink-0">
          <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-emerald-900/20">
              <Textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="What's on your mind?"
                className="bg-transparent border-none text-2xl font-black font-headline text-center resize-none placeholder:text-white/20 h-full flex items-center justify-center tracking-tighter"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <Button 
          onClick={handlePost}
          disabled={isPosting || !inputText.trim()}
          className="w-full h-14 bg-primary hover:glow-green text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all shadow-xl shrink-0"
        >
          {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>Post Update <Send className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </DialogContent>
  );
}
