
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, MoreVertical, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

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
  createdAt: any;
};

export function StatusSidebar() {
  const { user } = useUser();
  const db = useFirestore();
  const [newStatus, setNewStatus] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  const statusQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'statuses'), orderBy('createdAt', 'desc'), limit(50));
  }, [db]);

  const { data: statuses } = useCollection<StatusUpdate>(statusQuery);

  useEffect(() => {
    if (!statuses || !db) return;

    const fetchProfiles = async () => {
      const uids = Array.from(new Set(statuses.map(s => s.userId)));
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
  }, [statuses, db]);

  const handlePostStatus = async () => {
    if (!newStatus.trim() || !user || !db) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'statuses'), {
        userId: user.uid,
        content: newStatus,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      });
      setNewStatus('');
      toast({ title: "Status Updated", description: "Your update is now visible to contacts." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not post update." });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold font-headline text-white tracking-tighter uppercase">Updates</h2>
          <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-muted-foreground">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        <div className="glass p-4 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center glow-green shrink-0">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-white uppercase tracking-widest">My Update</p>
              <p className="text-[10px] text-muted-foreground">Share what's on your mind</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input 
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="What's happening?"
              className="bg-white/5 border-white/10 h-10 text-xs rounded-full focus-visible:ring-primary"
            />
            <Button 
              size="icon" 
              onClick={handlePostStatus}
              disabled={isPosting || !newStatus.trim()}
              className="rounded-full h-10 w-10 shrink-0"
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-2">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Recent Updates</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-24 md:pb-6 space-y-1">
          {statuses?.map((status) => {
            const profile = userProfiles[status.userId];
            if (!profile) return null;

            const name = profile.displayName || profile.fullName || 'User';
            const initials = name.charAt(0).toUpperCase();
            const avatarSrc = profile.profileImageUrl?.includes('mega.nz') ? `/api/avatar/${profile.id}?t=${Date.now()}` : null;

            return (
              <div key={status.id} className="w-full p-4 rounded-3xl flex items-center gap-4 hover:bg-white/5 transition-all group border border-transparent">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/40 p-0.5 glow-green">
                    <div className="w-full h-full rounded-full border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm font-bold text-primary">{initials}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm text-white truncate">{name}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                      {status.createdAt?.toDate ? formatDistanceToNow(status.createdAt.toDate(), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic truncate">
                    {status.content}
                  </p>
                </div>
              </div>
            );
          })}

          {(!statuses || statuses.length === 0) && (
            <div className="p-12 text-center space-y-4 opacity-30">
              <Globe className="w-12 h-12 mx-auto" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No recent updates</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
