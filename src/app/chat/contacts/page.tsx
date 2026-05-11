'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, UserPlus, MessageSquare, Loader2, 
  ArrowLeft, Info, User, Tag, Plus, LayoutGrid, X, AtSign, Phone,
  MoreVertical, UserMinus, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, where, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  email: string;
  phoneNumber?: string;
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
    const term = lookupTerm.trim().toLowerCase();
    if (!term || !db) return;
    setIsLookingUp(true);
    setHasLookedUp(false);
    setFoundUsers([]);

    try {
      // Parallel search protocol
      const qEmail = query(collection(db, 'users'), where('email', '==', term));
      const qUsername = query(collection(db, 'users'), where('username', '==', term));
      const qPhone = query(collection(db, 'users'), where('phoneNumber', '==', term));

      const [sEmail, sUsername, sPhone] = await Promise.all([
        getDocs(qEmail),
        getDocs(qUsername),
        getDocs(qPhone)
      ]);
      
      const combined = [...sEmail.docs, ...sUsername.docs, ...sPhone.docs];
      const uniqueUids = new Set();
      const results: UserProfile[] = [];

      combined.forEach(d => {
        const data = d.data() as UserProfile;
        if (!uniqueUids.has(data.id) && data.id !== user?.uid) {
          uniqueUids.add(data.id);
          results.push(data);
        }
      });

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

  const handleRemoveContact = async (contactId: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'contacts', contactId));
      toast({ title: "Shard Severed", description: "Contact removed from network." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Action Failed", description: "Could not remove shard." });
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
      <header className="h-20 md:h-24 px-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-xl z-[60] sticky top-0 shrink-0">
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
            <h1 className="text-xl md:text-3xl font-black font-headline text-gradient tracking-tight uppercase italic leading-none">Network</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest hidden sm:block mt-1">Verified Mesh v2.6</p>
          </div>
        </div>

        <Button 
          onClick={() => setIsAddMode(!isAddMode)}
          size="sm" 
          className={cn(
            "hidden md:flex font-black uppercase text-[10px] tracking-widest rounded-xl h-10 px-6 shadow-lg transition-all active:scale-95",
            isAddMode ? "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30" : "bg-primary text-primary-foreground hover:glow-green-bright"
          )}
        >
          {isAddMode ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> Add Shard</>}
        </Button>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="max-w-7xl mx-auto p-4 md:p-10 pt-0 space-y-6 md:space-y-10 pb-32">
          
          <AnimatePresence mode="wait">
            {isAddMode ? (
              <motion.div 
                key="add-interface"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-6 md:py-10 space-y-8"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black font-headline uppercase italic text-white leading-none">Initialize New Link</h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em]">Identity Parameter Search</p>
                  </div>

                  <form onSubmit={handleLookup} className="space-y-4">
                    <div className="relative group shadow-2xl">
                      <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
                      <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl flex items-center px-4 h-14 group-focus-within:border-primary/50 transition-all">
                        <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={lookupTerm}
                          onChange={(e) => setLookupTerm(e.target.value)}
                          placeholder="Handle, Email, or Phone..." 
                          className="bg-transparent border-none text-white text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-full w-full"
                        />
                        <Button type="submit" disabled={isLookingUp} variant="ghost" className="h-10 w-10 p-0 text-primary shrink-0">
                          {isLookingUp ? <Loader2 className="animate-spin" /> : <Search />}
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      type="button"
                      onClick={() => setIsAddMode(false)}
                      variant="outline"
                      className="md:hidden w-full h-14 rounded-2xl border-white/5 bg-white/5 font-black uppercase text-[10px] tracking-widest text-muted-foreground"
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel Lookup
                    </Button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {foundUsers.map(u => (
                      <motion.div 
                        key={u.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-primary/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#111] border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-primary">{u.username[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate text-sm">{u.fullName || u.username}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase font-black truncate">@{u.username}</p>
                        </div>
                        <Button onClick={() => handleAddContact(u)} size="sm" className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[9px] font-black uppercase tracking-widest rounded-xl h-10 px-4">
                          Establish
                        </Button>
                      </motion.div>
                    ))}
                    {hasLookedUp && foundUsers.length === 0 && (
                      <div className="col-span-full py-12 text-center opacity-30">
                        <p className="text-sm font-bold uppercase tracking-widest italic">Zero Shards Found</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="list-interface"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-6 md:py-10 space-y-6 md:space-y-12"
              >
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="relative group shadow-2xl">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
                    <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl flex items-center px-4 h-14 group-focus-within:border-primary/50 transition-all">
                      <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter Network Mesh..." 
                        className="bg-transparent border-none text-white text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-full w-full"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setIsAddMode(true)}
                    className="md:hidden w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-xl glow-green"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add New Shard
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredContacts.map((contact) => {
                      const name = contact.customName || contact.profile?.displayName || contact.profile?.fullName || 'User';
                      const initial = name.charAt(0).toUpperCase();

                      return (
                        <motion.div
                          key={contact.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                        >
                          <div className="glass border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-all group relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                            
                            <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shrink-0 relative">
                               <div className="absolute inset-0 bg-primary/5 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                               <span className="text-xl font-black text-primary relative z-10 leading-none">{initial}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white truncate text-sm font-headline uppercase tracking-tight">{name}</h3>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">@{contact.profile?.username || 'unknown'}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button 
                                onClick={() => router.push(`/chat/new-${contact.userId}`)}
                                className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5 mr-2" /> Message
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-white/5 text-muted-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#111] border-white/10 p-1 rounded-xl min-w-[160px] shadow-2xl z-[120]">
                                   <DropdownMenuItem onClick={() => router.push(`/chat/new-${contact.userId}?info=true`)} className="gap-3 p-3 rounded-lg cursor-pointer hover:bg-primary/10 text-white text-[9px] font-bold uppercase tracking-widest">
                                     <Info className="w-4 h-4" /> Identity Info
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handleRemoveContact(contact.id)} className="gap-3 p-3 rounded-lg cursor-pointer hover:bg-destructive/10 text-destructive text-[9px] font-bold uppercase tracking-widest">
                                     <UserMinus className="w-4 h-4" /> Sever Shard
                                   </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {filteredContacts.length === 0 && !searchQuery && (
                  <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-20">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-dashed border-white/20">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-white">Empty Network</h3>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">No secure signals detected</p>
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
