
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
  collection, query, where, getDocs, doc, setDoc, serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
      toast({ variant: "destructive", title: "Search Failed", description: "Could not find user." });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async () => {
    if (!foundUser || !currentUserId || !db) return;

    setIsAdding(true);
    try {
      // 1. Add target to current user's list
      const myRef = doc(db, 'users', currentUserId, 'contacts', foundUser.id);
      await setDoc(myRef, {
        userId: foundUser.id,
        addedAt: serverTimestamp(),
      });

      // 2. Add current user to target's list (Mutual Connection)
      // This ensures both can see each other's status updates instantly.
      const theirRef = doc(db, 'users', foundUser.id, 'contacts', currentUserId);
      await setDoc(theirRef, {
        userId: currentUserId,
        addedAt: serverTimestamp(),
      });

      toast({ title: "Contact Added", description: `${foundUser.fullName} is now in your network.` });
      
      onSuccess();
      router.push(`/chat/new-${foundUser.id}`);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Action Failed", description: "Could not add contact." });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/5 text-white p-0 overflow-hidden rounded-[2.5rem]">
      <DialogHeader className="p-8 pb-4">
        <DialogTitle className="text-2xl font-bold font-headline uppercase tracking-tight flex items-center gap-3 text-gradient">
          <UserPlus className="text-primary w-6 h-6" /> Find User
        </DialogTitle>
        <DialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em]">
          Search by email or phone number
        </DialogDescription>
      </DialogHeader>

      <div className="px-8 pb-8 space-y-6">
        <form onSubmit={handleSearch} className="relative group">
          <div className="relative flex gap-2">
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Email or Phone..."
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage src={`/api/avatar/${foundUser.id}`} />
                  <AvatarFallback>{foundUser.fullName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-lg font-bold text-white truncate font-headline">{foundUser.fullName}</h4>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">@{foundUser.username}</p>
                </div>
              </div>
              <Button onClick={handleAddContact} disabled={isAdding} className="w-full h-12 bg-primary hover:glow-green-bright text-primary-foreground font-bold uppercase text-xs tracking-[0.2em] rounded-xl transition-all">
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>Add Contact <Plus className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </motion.div>
          ) : hasSearched && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 space-y-3">
              <Search className="w-8 h-8 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-bold text-white uppercase font-headline">No user found</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DialogContent>
  );
}
