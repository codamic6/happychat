'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Search, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { StatusComposer } from '@/components/chat/StatusComposer';

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  profileImageUrl?: string;
};

type StatusUpdate = {
  id: string;
  userId: string;
  content: string;
  type: 'text' | 'image';
  createdAt: any;
  expiresAt: any;
};

export function StatusSidebar() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch user's contacts first
  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'contacts'));
  }, [db, user]);
  const { data: contactsData } = useCollection(contactsQuery);

  const contactIds = useMemo(() => {
    if (!user) return [];
    const ids = [user.uid];
    if (contactsData) {
      contactsData.forEach(c => ids.push(c.id));
    }
    return ids;
  }, [contactsData, user]);

  // 2. Fetch active statuses
  const now = new Date();
  const statusQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'statuses'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc'),
      limit(100)
    );
  }, [db]);

  const { data: rawStatuses } = useCollection<StatusUpdate>(statusQuery);

  // 3. Group statuses by user and filter by contacts
  const groupedStatuses = useMemo(() => {
    if (!rawStatuses) return [];
    const groups: Record<string, StatusUpdate[]> = {};
    
    rawStatuses.forEach(s => {
      if (contactIds.includes(s.userId)) {
        if (!groups[s.userId]) groups[s.userId] = [];
        groups[s.userId].push(s);
      }
    });
    
    return Object.entries(groups).sort(([uidA], [uidB]) => {
      if (uidA === user?.uid) return -1;
      if (uidB === user?.uid) return 1;
      return 0;
    });
  }, [rawStatuses, user?.uid, contactIds]);

  useEffect(() => {
    if (!rawStatuses || !db) return;

    const fetchProfiles = async () => {
      const uids = Array.from(new Set(rawStatuses.map(s => s.userId)));
      const missingUids = uids.filter(uid => !userProfiles[uid] && contactIds.includes(uid));

      if (missingUids.length > 0) {
        const newProfiles = { ...userProfiles };
        for (const uid of missingUids) {
          const q = query(collection(db, 'users'), where('id', '==', uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            newProfiles[uid] = snap.docs[0].data() as UserProfile;
          }
        }
        setUserProfiles(newProfiles);
      }
    };

    fetchProfiles();
  }, [rawStatuses, db, contactIds, userProfiles]);

  const myStatusGroup = groupedStatuses.find(([uid]) => uid === user?.uid);
  const otherStatusGroups = groupedStatuses.filter(([uid]) => uid !== user?.uid);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return otherStatusGroups;
    return otherStatusGroups.filter(([uid]) => {
      const p = userProfiles[uid];
      const name = p?.displayName || p?.fullName || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [otherStatusGroups, searchQuery, userProfiles]);

  const handleMyStatusClick = () => {
    if (myStatusGroup) {
      router.push(`/chat/status?uid=${user?.uid}`);
    } else {
      setIsComposerOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] relative">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Button 
                variant="ghost" size="icon" 
                onClick={() => router.push('/chat')}
                className="md:hidden text-muted-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-xl md:text-2xl font-bold font-headline text-white tracking-tighter uppercase">Updates</h2>
          </div>
          <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 glow-green">
                <Plus className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <StatusComposer onSuccess={() => setIsComposerOpen(false)} />
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search updates..." 
            className="bg-white/5 border-white/10 pl-12 h-12 text-sm rounded-full focus-visible:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 pb-32">
          <div className="space-y-4 px-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Status</h3>
            <button 
              onClick={handleMyStatusClick}
              className="w-full flex items-center gap-4 p-2 rounded-2xl hover:bg-white/5 transition-all text-left group"
            >
              <div className="relative shrink-0">
                <div className={cn(
                  "w-14 h-14 rounded-full p-1 transition-all",
                  myStatusGroup ? "bg-gradient-to-tr from-primary to-emerald-400 p-[2px] glow-green" : "border-2 border-dashed border-white/10"
                )}>
                  <div className="w-full h-full rounded-full bg-[#111] overflow-hidden flex items-center justify-center">
                    {user?.photoURL ? (
                      <img src={user.photoURL} className="w-full h-full object-cover" alt="Me" />
                    ) : (
                      <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="font-bold text-sm text-white font-headline">My Status</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {myStatusGroup ? 'Tap to view' : 'Share a moment'}
                </p>
              </div>
            </button>
          </div>

          <div className="space-y-4 px-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Updates</h3>
            <div className="space-y-1">
              {filteredGroups.map(([uid, items]) => {
                const profile = userProfiles[uid];
                if (!profile) return null;
                const name = profile.displayName || profile.fullName || 'User';
                const latest = items[items.length - 1];
                
                // Use new URL-based proxy for status avatars
                const avatarSrc = profile.profileImageUrl?.includes('mega.nz') 
                  ? `/api/avatar?url=${encodeURIComponent(profile.profileImageUrl)}&t=${Date.now()}` 
                  : null;

                return (
                  <button 
                    key={uid}
                    onClick={() => router.push(`/chat/status?uid=${uid}`)}
                    className="w-full p-3 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/5 text-left"
                  >
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-emerald-400 p-[2px] glow-green">
                        <div className="w-full h-full rounded-full bg-[#111] overflow-hidden flex items-center justify-center border-2 border-[#0d0d0d]">
                          <Avatar className="w-full h-full">
                            <AvatarImage src={avatarSrc || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary">{name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate font-headline">{name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        {latest.createdAt?.toDate ? formatDistanceToNow(latest.createdAt.toDate(), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredGroups.length === 0 && (
                <div className="py-12 text-center space-y-3 opacity-20">
                  <Clock className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No new updates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Mobile FAB for adding status */}
      <div className="md:hidden absolute bottom-24 right-6 z-50">
        <Button 
          onClick={() => setIsComposerOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl glow-green hover:scale-110 active:scale-95 transition-all"
        >
          <Plus className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
