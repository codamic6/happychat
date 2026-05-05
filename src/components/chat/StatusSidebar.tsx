
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Camera, Type, Loader2, Search, Clock } from 'lucide-react';
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

  // Only show statuses that haven't expired
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

  // Group statuses by user
  const groupedStatuses = useMemo(() => {
    if (!rawStatuses) return [];
    const groups: Record<string, StatusUpdate[]> = {};
    rawStatuses.forEach(s => {
      if (!groups[s.userId]) groups[s.userId] = [];
      groups[s.userId].push(s);
    });
    
    // Sort groups so "My Status" is first, then others by latest update
    return Object.entries(groups).sort(([uidA], [uidB]) => {
      if (uidA === user?.uid) return -1;
      if (uidB === user?.uid) return 1;
      return 0;
    });
  }, [rawStatuses, user?.uid]);

  useEffect(() => {
    if (!rawStatuses || !db) return;

    const fetchProfiles = async () => {
      const uids = Array.from(new Set(rawStatuses.map(s => s.userId)));
      const missingUids = uids.filter(uid => !userProfiles[uid]);

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
  }, [rawStatuses, db]);

  const myStatusGroup = groupedStatuses.find(([uid]) => uid === user?.uid);
  const otherStatusGroups = groupedStatuses.filter(([uid]) => uid !== user?.uid);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-headline text-white tracking-tighter uppercase">Updates</h2>
          <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 glow-green">
                <Plus className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <StatusComposer onSuccess={() => setIsComposerOpen(false)} />
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search updates..." 
            className="bg-white/5 border-white/10 pl-12 h-12 text-sm rounded-full focus-visible:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 pb-24">
          {/* My Status Section */}
          <div className="space-y-4 px-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Status</h3>
            <button 
              onClick={() => myStatusGroup && router.push(`/chat/status?uid=${user?.uid}`)}
              className="w-full flex items-center gap-4 p-2 rounded-2xl hover:bg-white/5 transition-all text-left group"
            >
              <div className="relative shrink-0">
                <div className={cn(
                  "w-14 h-14 rounded-full p-1 transition-all",
                  myStatusGroup ? "bg-gradient-to-tr from-primary to-emerald-400 p-[2px] glow-green" : "border-2 border-dashed border-white/10"
                )}>
                  <div className="w-full h-full rounded-full bg-[#111] overflow-hidden flex items-center justify-center">
                    {user?.photoURL ? (
                      <img src={user.photoURL} className="w-full h-full object-cover" />
                    ) : (
                      <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="font-bold text-sm text-white">My Status</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  {myStatusGroup ? 'Tap to view' : 'Share a moment'}
                </p>
              </div>
            </button>
          </div>

          {/* Contacts' Status Section */}
          <div className="space-y-4 px-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Updates</h3>
            <div className="space-y-1">
              {otherStatusGroups.map(([uid, items]) => {
                const profile = userProfiles[uid];
                if (!profile) return null;
                const name = profile.displayName || profile.fullName || 'User';
                const latest = items[items.length - 1];
                const isSelected = pathname.includes(`/chat/status`) && new URLSearchParams(window.location.search).get('uid') === uid;

                return (
                  <button 
                    key={uid}
                    onClick={() => router.push(`/chat/status?uid=${uid}`)}
                    className={cn(
                      "w-full p-3 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/5 text-left",
                      isSelected && "bg-white/5"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-emerald-400 p-[2px] glow-green">
                        <div className="w-full h-full rounded-full bg-[#111] overflow-hidden flex items-center justify-center border-2 border-[#0d0d0d]">
                          {profile.profileImageUrl?.includes('mega.nz') ? (
                            <img src={`/api/avatar/${uid}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-xl font-bold text-primary">{(profile.displayName || profile.fullName || 'U').charAt(0)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {latest.createdAt?.toDate ? formatDistanceToNow(latest.createdAt.toDate(), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  </button>
                );
              })}

              {otherStatusGroups.length === 0 && (
                <div className="py-12 text-center space-y-3 opacity-20">
                  <Clock className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No new updates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
