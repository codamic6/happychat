'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Loader2, 
  ArrowLeft, MessageSquare, Plus, X, 
  MoreVertical, UserMinus, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, where, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
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
      toast({ variant: 'destructive', title: "Search Error", description: "Could not connect to database." });
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

      toast({ title: "Contact Added", description: `${target.username} is now in your list.` });
      setIsAddMode(false);
      setLookupTerm('');
      setFoundUsers([]);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Could not add contact." });
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'contacts', contactId));
      toast({ title: "Contact Removed", description: "User removed from your list." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Could not remove contact." });
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
      <header className="px-6 py-8 border-b border-white/5 bg-black/60 backdrop-blur-xl z-[60] sticky top-0 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/chat')} 
              className="md:hidden text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-4xl font-black font-headline text-gradient tracking-tight uppercase italic leading-none">Contacts</h1>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-2">Manage your network</p>
            </div>
          </div>

          <Button 
            onClick={() => setIsAddMode(!isAddMode)}
            size="lg" 
            className={cn(
              "w-full md:w-auto font-black uppercase text-xs tracking-widest rounded-xl h-14 px-8 shadow-lg transition-all active:scale-95",
              isAddMode ? "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30" : "bg-primary text-primary-foreground hover:glow-green-bright"
            )}
          >
            {isAddMode ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> Add Contact</>}
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-6 md:space-y-10 pb-32">
          
          <AnimatePresence mode="wait">
            {isAddMode ? (
              <motion.div 
                key="add-interface"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  <form onSubmit={handleLookup} className="space-y-4">
                    <div className="relative group shadow-2xl">
                      <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
                      <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl flex items-center px-4 h-16 group-focus-within:border-primary/50 transition-all">
                        <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={lookupTerm}
                          onChange={(e) => setLookupTerm(e.target.value)}
                          placeholder="Search by Username, Email, or Phone..." 
                          className="bg-transparent border-none text-white text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-full w-full"
                        />
                        <Button type="submit" disabled={isLookingUp} variant="ghost" className="h-12 w-12 p-0 text-primary shrink-0">
                          {isLookingUp ? <Loader2 className="animate-spin" /> : <Search />}
                        </Button>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-3">
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
                        <Button onClick={() => handleAddContact(u)} className="bg-primary hover:glow-green text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl h-12 px-6">
                          Add
                        </Button>
                      </motion.div>
                    ))}
                    {hasLookedUp && foundUsers.length === 0 && (
                      <div className="py-20 text-center opacity-30">
                        <p className="text-sm font-bold uppercase tracking-widest italic">No users found</p>
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
                className="space-y-8"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="relative group shadow-2xl">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
                    <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl flex items-center px-4 h-16 group-focus-within:border-primary/50 transition-all">
                      <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your contacts..." 
                        className="bg-transparent border-none text-white text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-full w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
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
                          <div 
                            onClick={() => router.push(`/chat/new-${contact.userId}`)}
                            className="glass border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-all group cursor-pointer relative"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                            
                            <div className="w-14 h-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shrink-0">
                               <span className="text-xl font-bold text-primary">{initial}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white truncate text-base font-headline uppercase tracking-tight">{name}</h3>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">@{contact.profile?.username || 'unknown'}</p>
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-white/5 text-muted-foreground">
                                    <MoreVertical className="w-5 h-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#111] border-white/10 p-1 rounded-xl min-w-[180px] shadow-2xl z-[120]">
                                   <DropdownMenuItem onClick={() => router.push(`/chat/new-${contact.userId}?info=true`)} className="gap-3 p-4 rounded-lg cursor-pointer hover:bg-primary/10 text-white text-[10px] font-bold uppercase tracking-widest">
                                     <Info className="w-4 h-4" /> View Details
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handleRemoveContact(contact.id)} className="gap-3 p-4 rounded-lg cursor-pointer hover:bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest">
                                     <UserMinus className="w-4 h-4" /> Remove Contact
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
                    <Users className="w-12 h-12 text-white" />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white">No Contacts</h3>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Your list is currently empty</p>
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
