'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, UserPlus, MessageSquare, Loader2, 
  ArrowLeft, Info, User, Tag, Plus, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, where, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { AddContactDialogContent } from '@/components/chat/AddContactDialogContent';
import { cn } from '@/lib/utils';

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
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactProfiles, setContactProfiles] = useState<Record<string, UserProfile>>({});

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

      if (changed) {
        setContactProfiles(newProfiles);
      }
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

    return list.filter(item => {
      const name = item.customName || item.profile?.displayName || item.profile?.fullName || '';
      const username = item.profile?.username || '';
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [userContacts, contactProfiles, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050505] h-full overflow-hidden relative">
      {/* Dynamic Header */}
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

        <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:glow-green-bright text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl h-10 px-6 shadow-lg transition-all active:scale-95">
              <Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Add Contact</span>
            </Button>
          </DialogTrigger>
          <AddContactDialogContent onSuccess={() => setIsAddContactOpen(false)} currentUserId={user?.uid} />
        </Dialog>
      </header>

      {/* Floating Search Area */}
      <div className="px-6 py-6 md:py-8 bg-gradient-to-b from-black/20 to-transparent flex-none">
        <div className="relative group max-w-3xl mx-auto shadow-2xl">
          <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl flex items-center px-4 h-14 group-focus-within:border-primary/50 transition-all">
            <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your global network..." 
              className="bg-transparent border-none text-white text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-full w-full"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="max-w-7xl mx-auto p-6 md:p-10 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
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
                    <Card className="glass border-white/5 p-6 hover:border-primary/40 transition-all group relative overflow-hidden rounded-[2rem] shadow-xl hover:shadow-primary/5">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-[#111] border-2 border-white/5 flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
                           <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                           <span className="text-3xl font-black text-primary relative z-10">{initial}</span>
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

          {filteredContacts.length === 0 && (
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
        </div>
      </ScrollArea>
    </div>
  );
}
