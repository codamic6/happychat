
'use client';

import React, { useState } from 'react';
import { 
  Search, UserPlus, Mail, Phone, Loader2, Plus, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFirestore } from '@/firebase';
import { 
  collection, query, where, getDocs, doc, setDoc, serverTimestamp, addDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

type UserProfile = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  profileImageUrl: string;
};

export function AddContactDialogContent({ onSuccess, currentUserId }: { onSuccess: () => void, currentUserId?: string }) {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !db) return;

    setIsSearching(true);
    setHasSearched(false);
    setFoundUser(null);

    try {
      let q = query(collection(db, 'users'), where('email', '==', searchTerm.toLowerCase().trim()));
      let snap = await getDocs(q);

      if (snap.empty) {
        q = query(collection(db, 'users'), where('phoneNumber', '==', searchTerm.trim()));
        snap = await getDocs(q);
      }

      if (!snap.empty) {
        const userData = snap.docs[0].data() as UserProfile;
        if (userData.id !== currentUserId) {
          setFoundUser(userData);
        }
      }
      setHasSearched(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Search Error", description: "Protocol failed to scan directory." });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async () => {
    if (!foundUser || !currentUserId || !db) return;

    setIsAdding(true);
    try {
      // 1. Add to contacts subcollection
      await setDoc(doc(db, 'users', currentUserId, 'contacts', foundUser.id), {
        userId: foundUser.id,
        addedAt: serverTimestamp(),
      });

      // 2. Initialize a conversation if none exists
      const existingConvQ = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', currentUserId)
      );
      const snap = await getDocs(existingConvQ);
      const existing = snap.docs.find(d => (d.data().participantIds as string[]).includes(foundUser.id));

      if (!existing) {
        await addDoc(collection(db, 'conversations'), {
          participantIds: [currentUserId, foundUser.id].sort(),
          updatedAt: serverTimestamp(),
          adminId: currentUserId
        });
      }

      toast({ title: "Identity Saved", description: `${foundUser.fullName} added to neural network.` });
      onSuccess();
    } catch (err) {
      toast({ variant: "destructive", title: "Protocol Failed", description: "Identity link could not be established." });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/5 text-white p-0 overflow-hidden rounded-[2.5rem]">
      <DialogHeader className="p-8 pb-4">
        <DialogTitle className="text-2xl font-black font-headline italic uppercase tracking-tight flex items-center gap-3 text-gradient">
          <UserPlus className="text-primary w-6 h-6" /> Index Identity
        </DialogTitle>
        <DialogDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.3em]">
          Locate user by email or secure line
        </DialogDescription>
      </DialogHeader>

      <div className="px-8 pb-8 space-y-6">
        <form onSubmit={handleSearch} className="relative group">
          <div className="relative flex gap-2">
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Identifier (email/phone)..."
              className="bg-white/5 border-white/10 h-14 pl-5 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all text-sm"
            />
            <Button 
              type="submit" 
              disabled={isSearching || !searchTerm.trim()}
              className="h-14 w-14 bg-white/5 border border-white/10 hover:bg-primary hover:text-primary-foreground rounded-2xl transition-all glow-green"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {foundUser ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-3xl border border-white/5 space-y-4"
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage src={foundUser.profileImageUrl} />
                  <AvatarFallback>{foundUser.fullName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-lg font-bold text-white truncate font-headline">{foundUser.fullName}</h4>
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">@{foundUser.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-primary" />
                  <span className="truncate">{foundUser.email}</span>
                </div>
                {foundUser.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-primary" />
                    <span>{foundUser.phoneNumber}</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleAddContact}
                disabled={isAdding}
                className="w-full h-12 bg-primary hover:glow-green-bright text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>Establish Link <Plus className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </motion.div>
          ) : hasSearched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 space-y-3"
            >
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30 border border-white/5">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase italic font-headline">Identity Not Found</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Protocol scan returned zero results</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DialogContent>
  );
}
