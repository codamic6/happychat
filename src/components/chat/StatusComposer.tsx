
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Type, Send, Loader2, X
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

  // Ensure text is cleared when the component is unmounted or on specific reset
  useEffect(() => {
    return () => setInputText('');
  }, []);

  const handlePost = async () => {
    if (!user || !db || isPosting || !inputText.trim()) return;

    setIsPosting(true);
    try {
      console.log(`[Firestore TRACE] addDoc to statuses: User ${user.uid} is posting a new status.`);
      
      await addDoc(collection(db, 'statuses'), {
        userId: user.uid,
        content: inputText.trim(),
        type: 'text',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      toast({ title: "Moment Shared", description: "Your status is now live for 24 hours." });
      
      // Clear local state before closing
      setInputText('');
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Post Failed', description: err.message });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/5 text-white p-0 overflow-hidden rounded-[2.5rem] max-h-[90vh] flex flex-col shadow-2xl">
      <DialogHeader className="p-8 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-2xl font-bold font-headline uppercase tracking-tight text-gradient">
            New Moment
          </DialogTitle>
        </div>
        <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Express yourself. Vanishes in 24 hours.
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 pb-8 space-y-6 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-[300px] relative bg-white/5 rounded-[2rem] overflow-hidden group border border-white/5 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-emerald-900/10 to-transparent pointer-events-none" />
          
          <Textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your moment..."
            className="absolute inset-0 w-full h-full bg-transparent border-none text-2xl md:text-3xl font-black font-headline text-center resize-none placeholder:text-white/10 p-12 flex items-center justify-center tracking-tighter leading-tight focus-visible:ring-0 focus-visible:ring-offset-0 custom-scrollbar"
          />
          
          <div className="absolute bottom-4 right-6 flex items-center gap-2 opacity-30 group-focus-within:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold uppercase tracking-widest">{inputText.length} characters</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handlePost}
            disabled={isPosting || !inputText.trim()}
            className="flex-1 h-14 bg-primary hover:glow-green text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95"
          >
            {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Share Moment <Send className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
