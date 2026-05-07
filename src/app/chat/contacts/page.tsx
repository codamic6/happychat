
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, UserPlus, MessageSquare, Loader2, 
  ArrowLeft, Info, User, Tag
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
    <div className="flex-1 flex flex-col bg-[#050505] h-full overflow-hidden">
      <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden text-muted-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-sm font-bold uppercase tracking-widest text-white">Contacts</h1>
          </div>
        </div>
        <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:glow-green text-primary-foreground font-bold uppercase text-[10px] tracking-widest rounded-full h-8 px-4">
              <UserPlus className="w-3.5 h-3.5 mr-2" /> New Contact
            </Button>
          </DialogTrigger>
          <AddContactDialogContent onSuccess={() => setIsAddContactOpen(false)} currentUserId={user?.uid} />
        </Dialog>
      </header>

      <div className="p-6 shrink-0">
        <div className="relative group max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your network..." 
            className="bg-white/5 border-white/10 pl-12 h-12 text-sm rounded-full focus-visible:ring-primary focus-visible:ring-offset-0"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-5xl mx-auto p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredContacts.map((contact) => {
                const name = contact.customName || contact.profile?.displayName || contact.profile?.fullName || 'User';
                const initial = name.charAt(0).toUpperCase();

                return (
                  <motion.div
                    key={contact.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="glass border-white/5 p-4 hover:border-primary/30 transition-all group relative overflow-hidden">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shrink-0">
                          <span className="text-xl font-bold text-primary">{initial}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white truncate">{name}</h3>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                            @{contact.profile?.username || 'unknown'}
                          </p>
                          {contact.customName && (
                            <p className="text-[9px] text-primary/60 font-medium italic mt-1 truncate">
                              Alias: {contact.profile?.fullName || 'No original name'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Button 
                          onClick={() => router.push(`/chat/new-${contact.userId}`)}
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 h-9 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/5 text-[10px] font-bold uppercase tracking-widest"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-2" /> Message
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 border border-white/5"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-30">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-dashed border-white/20">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-widest">No Contacts Found</h3>
                <p className="text-[10px] uppercase font-bold tracking-tight">Expand your network to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
