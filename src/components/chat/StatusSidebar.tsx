
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Clock, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { StatusComposer } from '@/components/chat/StatusComposer';
import { useIsMobile } from '@/hooks/use-mobile';

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  updatedAt?: any;
};

type StatusUpdate = {
  id: string;
  userId: string;
  content: string;
  type: 'text';
  createdAt: any;
  expiresAt: any;
  viewedBy?: string[];
};

function formatStatusTime(date: Date, isMobile: boolean) {
  const now = new Date();
  const diffSec = differenceInSeconds(now, date);
  const diffMin = differenceInMinutes(now, date);
  const diffHour = differenceInHours(now, date);
  const diffDay = differenceInDays(now, date);

  if (diffSec < 60) return "NOW";

  if (isMobile) {
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    return `${diffDay}d`;
  } else {
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    return `${diffDay}d`;
  }
}

function SegmentedRing({ count, hasUnseen, size = 56 }: { count: number, hasUnseen: boolean, size?: number }) {
  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;
  const gap = count > 1 ? 4 : 0;
  const segmentLength = (circumference - (gap * count)) / count;
  const color = hasUnseen ? "hsl(var(--primary))" : "rgba(255, 255, 255, 0.2)";

  return (
    <svg 
      width={size} 
      height={size} 
      className="absolute inset-0 -rotate-90 pointer-events-none"
    >
      {Array.from({ length: count }).map((_, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${segmentLength} ${gap}`}
          strokeDashoffset={-(i * (segmentLength + gap))}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      ))}
    </svg>
  );
}

export function StatusSidebar() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // SECURE REFERENCE: Ensure cleanup on logout
  const currentUserRef = useMemoFirebase(() => (user?.uid && db ? doc(db, 'users', user.uid) : null), [db, user?.uid]);
  const { data: profile } = useDoc<UserProfile>(currentUserRef);

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'users', user.uid, 'contacts'));
  }, [db, user?.uid]);
  const { data: contactsData } = useCollection(contactsQuery);

  const contactIds = useMemo(() => {
    if (!user?.uid) return [];
    const ids = [user.uid];
    if (contactsData) {
      contactsData.forEach(c => ids.push(c.userId));
    }
    return ids;
  }, [contactsData, user?.uid]);

  const statusQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'statuses'),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt', 'desc'),
      limit(100)
    );
  }, [db, user?.uid]);

  const { data: rawStatuses } = useCollection<StatusUpdate>(statusQuery);

  const statusGroups = useMemo(() => {
    if (!rawStatuses || !user?.uid) return [];
    const groups: Record<string, StatusUpdate[]> = {};
    
    rawStatuses.forEach(s => {
      if (contactIds.includes(s.userId)) {
        if (!groups[s.userId]) groups[s.userId] = [];
        groups[s.userId].push(s);
      }
    });
    
    return Object.entries(groups).map(([uid, items]) => {
      const hasUnseen = items.some(item => !item.viewedBy?.includes(user.uid));
      return { uid, items, hasUnseen };
    });
  }, [rawStatuses, user?.uid, contactIds]);

  const recentUpdates = useMemo(() => statusGroups.filter(g => g.uid !== user?.uid && g.hasUnseen), [statusGroups, user?.uid]);
  const viewedUpdates = useMemo(() => statusGroups.filter(g => g.uid !== user?.uid && !g.hasUnseen), [statusGroups, user?.uid]);
  const myStatusGroup = useMemo(() => statusGroups.find(g => g.uid === user?.uid), [statusGroups, user?.uid]);

  useEffect(() => {
    if (!rawStatuses || !db || !user?.uid) return;

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
  }, [rawStatuses, db, contactIds, user?.uid]);

  const filteredRecent = recentUpdates.filter(g => {
    const p = userProfiles[g.uid];
    const name = p?.displayName || p?.fullName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredViewed = viewedUpdates.filter(g => {
    const p = userProfiles[g.uid];
    const name = p?.displayName || p?.fullName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] relative overflow-hidden">
      <div className="p-6 space-y-6 flex-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Button 
                variant="ghost" size="icon" 
                onClick={() => router.push('/chat')}
                className="md:hidden text-muted-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-bold font-headline text-white tracking-tighter uppercase italic">Updates</h2>
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
            className="bg-white/5 border-white/10 pl-12 h-12 text-sm rounded-xl focus-visible:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-8 pb-32">
          <div className="space-y-4 px-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Status</h3>
            <button 
              onClick={() => myStatusGroup ? router.push(`/chat/status?uid=${user?.uid}`) : setIsComposerOpen(true)}
              className="w-full flex items-center gap-4 p-2 rounded-2xl hover:bg-white/5 transition-all text-left"
            >
              <div className="relative shrink-0 flex items-center justify-center w-14 h-14">
                {myStatusGroup && (
                  <SegmentedRing count={myStatusGroup.items.length} hasUnseen={myStatusGroup.hasUnseen} />
                )}
                {!myStatusGroup && (
                  <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full" />
                )}
                <div className="w-12 h-12 rounded-full bg-[#111] overflow-hidden flex items-center justify-center border border-white/5">
                  <div className="text-sm font-bold text-primary">{(profile?.fullName || 'U').charAt(0).toUpperCase()}</div>
                </div>
                {!myStatusGroup && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-[#0d0d0d] text-primary-foreground">
                    <Plus className="w-3 h-3 stroke-[4]" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-white font-headline uppercase italic">My Status</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">
                  {myStatusGroup ? 'Tap to view' : 'Share a moment'}
                </p>
              </div>
            </button>
          </div>

          {filteredRecent.length > 0 && (
            <div className="space-y-4 px-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent</h3>
              <div className="space-y-1">
                {filteredRecent.map((group) => {
                  const p = userProfiles[group.uid];
                  if (!p) return null;
                  const name = p.displayName || p.fullName || 'User';
                  const latest = group.items[0];

                  return (
                    <button 
                      key={group.uid}
                      onClick={() => router.push(`/chat/status?uid=${group.uid}`)}
                      className="w-full p-3 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/5 text-left"
                    >
                      <div className="relative shrink-0 flex items-center justify-center w-14 h-14">
                        <SegmentedRing count={group.items.length} hasUnseen={group.hasUnseen} />
                        <Avatar className="w-12 h-12 border border-[#0d0d0d]">
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate font-headline uppercase italic">{name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          {latest.createdAt?.toDate ? formatStatusTime(latest.createdAt.toDate(), isMobile) : ''}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredViewed.length > 0 && (
            <div className="space-y-4 px-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Viewed</h3>
              <div className="space-y-1">
                {filteredViewed.map((group) => {
                  const p = userProfiles[group.uid];
                  if (!p) return null;
                  const name = p.displayName || p.fullName || 'User';
                  const latest = group.items[0];

                  return (
                    <button 
                      key={group.uid}
                      onClick={() => router.push(`/chat/status?uid=${group.uid}`)}
                      className="w-full p-3 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/5 text-left opacity-60"
                    >
                      <div className="relative shrink-0 flex items-center justify-center w-14 h-14">
                        <SegmentedRing count={group.items.length} hasUnseen={false} />
                        <Avatar className="w-12 h-12 border border-[#0d0d0d]">
                          <AvatarFallback className="bg-white/5 text-muted-foreground font-bold">{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate font-headline uppercase italic">{name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          {latest.createdAt?.toDate ? formatStatusTime(latest.createdAt.toDate(), isMobile) : ''}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {statusGroups.length === 0 && (
            <div className="py-24 text-center space-y-3 opacity-20">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em]">No moments yet</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="md:hidden absolute bottom-24 right-6 z-50">
        <Button 
          onClick={() => setIsComposerOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl glow-green transition-all active:scale-95"
        >
          <Plus className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
