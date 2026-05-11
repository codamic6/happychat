'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, UserPlus, MessageSquare, Loader2, 
  ArrowLeft, Info, User, Tag, Plus, LayoutGrid, X, AtSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  email: string;
  about?: string;
};

type ContactRecord = {
  id: string;
  userId: string;
  customName?: string;
  addedAt: any;
};

export default function ContactsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMode, setIsAddMode] = useState(false);
  const [contactProfiles, setContactProfiles] = useState<Record<string, UserProfile>>({});
  
  // Search for new contacts state
  const [lookupTerm, setLookupTerm] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundUsers, setFoundUsers] = useState<UserProfile[]>([]);
  const [hasLookedUp, setHasLookedUp] = useState(false);

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'contacts'));
  }, [db, user]);

  const { data: userContacts, isLoading } = useCollection<ContactRecord>(contactsQuery);

  useEffect(() => {
    if (!userContacts || !db) return;

    const fetchProfiles = async () => {
      const newProfiles = { ...contactProfiles };
      let changed = false;

      for (const contact of userContacts) {
        if (!newProfiles[contact.userId]) {
          const q = query(collection(db, 'users'), where('id', '==', contact.userId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            newProfiles[contact.userId] = snap.docs[0].data() as UserProfile;
            changed = true;
          }
        }
      }

      if (changed) setContactProfiles(newProfiles);
    };

    fetchProfiles();
  }, [userContacts, db]);

  const filteredContacts = useMemo(() => {
    if (!userContacts) return [];
    const list = userContacts.map(contact => ({
      ...contact,
      profile: contactProfiles[contact.userId]
    }));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => {
      const name = item.customName || item.profile?.displayName || item.profile?.fullName || '';
      const username = item.profile?.username || '';
      return name.toLowerCase().includes(q) || username.toLowerCase().includes(q);
    });
  }, [userContacts, contactProfiles, searchQuery]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupTerm.trim() || !db) return;
    setIsLookingUp(true);
    setHasLookedUp(false);
    setFoundUsers([]);

    try {
      // Search by email
      let q = query(collection(db, 'users'), where('email', '==', lookupTerm.toLowerCase().trim()));
      let snap = await getDocs(q);
      
      // If empty, search by username
      if (snap.empty) {
        q = query(collection(db, 'users'), where('username', '==', lookupTerm.toLowerCase().trim()));
        snap = await getDocs(q);
      }

      const results = snap.docs
        .map(d => d.data() as UserProfile)
        .filter(u => u.id !== user?.uid);

      setFoundUsers(results);
      setHasLookedUp(true);
    } catch (e) {
      toast({ variant: 'destructive', title: "Search Error", description: "Signal interference detected." });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddContact = async (target: UserProfile) => {
    if (!user || !db) return;
    try {
      const myRef = doc(db, 'users', user.uid, 'contacts', target.id);
      await setDoc(myRef, {
        userId: target.id,
        customName: target.fullName || target.displayName || target.username,
        addedAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: "Signal Established", description: `${target.username} is now in your mesh.` });
      setIsAddMode(false);
      setLookupTerm('');
      setFoundUsers([]);
    } catch (e) {
      toast({ variant: 'destructive', title: "Link Failed", description: "Could not create contact shard." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050505] h-full overflow-hidden relative">
      <header className="h-20 md:h-24 px-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-xl z-[60] sticky top-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/chat')} 
            className="md:hidden text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-3xl font-black font-headline text-gradient tracking-tight uppercase italic">Network</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest hidden sm:block">Secure Connections Only</p>
          </div>
        </div>

        <Button 
          onClick={() => setIsAddMode(!isAddMode)}
          size="sm" 
          className={cn(
            "font-black uppercase text-[10px] tracking-widest rounded-xl h-10 px-6 shadow-lg transition-all active:scale-95",
            isAddMode ? "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30" : "bg-primary text-primary-foreground hover:glow-green-bright"
          )}
        >
          {isAddMode ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> Add Shard</>}
        </Button>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="max-w-7xl mx-auto p-6 md:p-10 pt-0 space-y-10 pb-32">
          
          <AnimatePresence mode="wait">
            {isAddMode ? (
              <motion.div 
                key="add-interface"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-10 space-y-8"
              >
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black font-headline uppercase italic text-white">Initialize New Link</h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em]">Search the global mesh by handle or email</p>
                  </div>

                  <form onSubmit={handleLookup} className="relative group shadow-2xl">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
                    <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl flex items-center px-4 h-14 group-focus-within:border-primary/50 transition-all">
                      <AtSign className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        value={lookupTerm}
                        onChange={(e) => setLookupTerm(e.target.value)}
                        placeholder="Search Identity..." 
                        className="bg-transparent border-none text-white text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-full w-full"
                      />
                      <Button type="submit" disabled={isLookingUp} variant="ghost" className="h-10 w-10 p-0 text-primary">
                        {isLookingUp ? <Loader2 className="animate-spin" /> : <Search />}
                      </Button>
                    </div>
                  </form>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {foundUsers.map(u => (
                      <motion.div 
                        key={u.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-primary/30 transition-all"
                      >
                        <Avatar className="w-12 h-12 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{u.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate">{u.fullName || u.username}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase font-black">@{u.username}</p>
                        </div>
                        <Button onClick={() => handleAddContact(u)} size="sm" className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[8px] font-black uppercase tracking-widest rounded-lg h-8">
                          Link
                        </Button>
                      </motion.div>
                    ))}
                    {hasLookedUp && foundUsers.length === 0 && (
                      <div className="col-span-full py-12 text-center opacity-30">
                        <p className="text-sm font-bold uppercase tracking-widest">Zero Signals Found</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-b border-white/5 w-full" />
              </motion.div>
            ) : (
              <motion.div 
                key="list-interface"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10"
              >
                <div className="relative group max-w-3xl mx-auto shadow-2xl mb-12">
                  <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
                  <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl flex items-center px-4 h-14 group-focus-within:border-primary/50 transition-all">
                    <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter mesh network..." 
                      className="bg-transparent border-none text-white text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-full w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredContacts.map((contact) => {
                      const name = contact.customName || contact.profile?.displayName || contact.profile?.fullName || 'User';
                      const initial = name.charAt(0).toUpperCase();

                      return (
                        <motion.div
                          key={contact.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                          <Card className="glass border-white/5 p-6 hover:border-primary/40 transition-all group relative overflow-hidden rounded-[2rem] shadow-xl">
                            <div className="flex flex-col items-center text-center space-y-4">
                              <div className="w-20 h-20 rounded-full bg-[#111] border-2 border-white/5 flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
                                 <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                 <span className="text-3xl font-black text-primary relative z-10 leading-none">{initial}</span>
                              </div>
                              
                              <div className="space-y-1 w-full">
                                <h3 className="text-lg font-bold text-white truncate font-headline uppercase tracking-tight">{name}</h3>
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">@{contact.profile?.username || 'unknown'}</span>
                                </div>
                              </div>

                              <div className="w-full pt-4 grid grid-cols-2 gap-2">
                                <Button 
                                  onClick={() => router.push(`/chat/new-${contact.userId}`)}
                                  className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" /> Message
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-12 w-12 rounded-xl border-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
                                >
                                  <Info className="w-5 h-5" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {filteredContacts.length === 0 && !searchQuery && (
                  <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
                    <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center border border-dashed border-white/20">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold uppercase tracking-widest text-white">Empty Network</h3>
                      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground max-w-xs leading-relaxed">Expand your horizons by adding secure contacts to your dashboard</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
