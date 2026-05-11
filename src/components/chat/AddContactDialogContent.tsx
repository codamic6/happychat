
'use client';

import React, { useState } from 'react';
import { 
  Search, UserPlus, Mail, Phone, Loader2, Plus, X, User, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFirestore } from '@/firebase';
import { 
  collection, query, where, getDocs, doc, setDoc, serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

type UserProfile = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
};

export function AddContactDialogContent({ onSuccess, currentUserId }: { onSuccess: () => void, currentUserId?: string }) {
  const db = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [customName, setCustomName] = useState('');
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
    setCustomName('');

    try {
      // Priority search: email
      let q = query(collection(db, 'users'), where('email', '==', searchTerm.toLowerCase().trim()));
      let snap = await getDocs(q);

      if (snap.empty) {
        // Fallback: phone
        q = query(collection(db, 'users'), where('phoneNumber', '==', searchTerm.trim()));
        snap = await getDocs(q);
      }

      if (snap.empty) {
        // Fallback: username
        q = query(collection(db, 'users'), where('username', '==', searchTerm.toLowerCase().trim()));
        snap = await getDocs(q);
      }

      if (!snap.empty) {
        const userData = snap.docs[0].data() as UserProfile;
        if (userData.id !== currentUserId) {
          setFoundUser(userData);
          setCustomName(userData.fullName); // Default to their current name
        } else {
          toast({ title: "Self-Search", description: "You cannot add yourself as a contact." });
        }
      }
      setHasSearched(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Search Failed", description: "Protocol link timed out." });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async () => {
    if (!foundUser || !currentUserId || !db) return;

    setIsAdding(true);
    try {
      const myRef = doc(db, 'users', currentUserId, 'contacts', foundUser.id);
      await setDoc(myRef, {
        userId: foundUser.id,
        customName: customName.trim() || foundUser.fullName,
        addedAt: serverTimestamp(),
      }, { merge: true });

      const theirRef = doc(db, 'users', foundUser.id, 'contacts', currentUserId);
      await setDoc(theirRef, {
        userId: currentUserId,
        addedAt: serverTimestamp(),
      }, { merge: true });

      toast({ 
        title: "Contact Synced", 
        description: `${customName.trim() || foundUser.fullName} is now in your mesh.` 
      });
      
      onSuccess();
      router.push(`/chat/new-${foundUser.id}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not establish contact shard." });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/5 text-white p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
      <DialogHeader className="p-8 pb-4">
        <DialogTitle className="text-2xl font-bold font-headline uppercase tracking-tight flex items-center gap-3 text-gradient">
          <UserPlus className="text-primary w-6 h-6" /> Add Contact
        </DialogTitle>
        <DialogDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em]">
          Identify by email, phone, or handle
        </DialogDescription>
      </DialogHeader>

      <div className="px-8 pb-8 space-y-6">
        <form onSubmit={handleSearch} className="relative group">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Secure ID lookup..."
                className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all text-sm"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSearching || !searchTerm.trim()}
              className="h-14 w-14 bg-white/5 border border-white/10 hover:bg-primary hover:text-primary-foreground rounded-2xl transition-all glow-green"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </Button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {foundUser ? (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-6 rounded-3xl border border-white/5 space-y-6 shadow-xl"
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20 bg-[#111]">
                  <AvatarFallback className="text-xl font-bold text-primary not-italic flex items-center justify-center leading-none h-full w-full">
                    {foundUser.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-lg font-bold text-white truncate font-headline">{foundUser.fullName}</h4>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                    <User className="w-3 h-3" /> @{foundUser.username}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Tag className="w-3 h-3" /> Custom Nickname
                </Label>
                <Input 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Best Friend, HQ, etc."
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-sm focus-visible:ring-primary"
                />
              </div>

              <Button 
                onClick={handleAddContact} 
                disabled={isAdding} 
                className="w-full h-14 bg-primary hover:glow-green-bright text-primary-foreground font-bold uppercase text-xs tracking-[0.2em] rounded-xl transition-all"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>Establish Link <Plus className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </motion.div>
          ) : hasSearched && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/20">
                <Search className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-sm font-bold text-white uppercase font-headline">Zero Signals Found</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Adjust search parameters</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DialogContent>
  );
}
