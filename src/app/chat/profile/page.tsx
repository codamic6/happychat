'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Camera, Loader2, LogOut, Settings, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { uploadProfileImageToMega } from '@/app/actions/profile';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type UserProfile = {
  id: string;
  fullName: string;
  displayName: string;
  username: string;
  email: string;
  phoneNumber: string;
  about: string;
  profileImageUrl: string;
  isOnline: boolean;
  updatedAt: any;
};

export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRef = useMemo(() => (user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    about: '',
    phoneNumber: '',
    isOnline: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || profile.fullName || '',
        username: profile.username || '',
        about: profile.about || '',
        phoneNumber: profile.phoneNumber || '',
        isOnline: profile.isOnline ?? true
      });
      // Reset image error only when the profile explicitly changes
      setImageError(false);
    }
  }, [profile?.profileImageUrl, profile?.updatedAt]);

  const handleCheckUsername = async (val: string) => {
    if (!val || val === profile?.username) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const q = query(collection(db, 'users'), where('username', '==', val.toLowerCase().trim()));
      const snap = await getDocs(q);
      setUsernameStatus(snap.empty ? 'available' : 'taken');
    } catch (e) {
      setUsernameStatus('idle');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !db) return;

    setIsUploading(true);
    setImageError(false);
    
    const megaFormData = new FormData();
    megaFormData.append('file', file);

    try {
      const result = await uploadProfileImageToMega(megaFormData, user.uid);
      if (result && 'url' in result) {
        toast({ title: "Photo Updated", description: "Your profile picture has been synced." });
      } else {
        toast({ variant: "destructive", title: "Upload Failed", description: result.error });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Connection failed." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving || !db) return;

    if (usernameStatus === 'taken') {
      toast({ variant: "destructive", title: "Error", description: "Username is unavailable." });
      return;
    }

    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: formData.displayName,
        username: formData.username.toLowerCase().trim(),
        about: formData.about,
        phoneNumber: formData.phoneNumber,
        isOnline: formData.isOnline,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Saved", description: "Changes applied successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const name = profile?.displayName || profile?.fullName || 'User';
  const initial = name.charAt(0).toUpperCase();
  const t = profile?.updatedAt?.toMillis?.() || Date.now();
  const avatarSrc = profile?.id ? `/api/avatar/${profile.id}?t=${t}` : null;

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] custom-scrollbar overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-20 space-y-8 pb-32">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden self-start">
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
          </Button>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
              <Settings className="w-3 h-3" /> Account Settings
            </div>
            <h1 className="text-3xl md:text-6xl font-bold font-headline tracking-tighter text-gradient">My Profile</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="glass p-8 border-white/5 flex flex-col items-center text-center space-y-6 rounded-[2rem] lg:col-span-1">
            <div className="relative">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-primary/20 bg-[#0d0d0d] overflow-hidden flex items-center justify-center">
                {!imageError && profile?.profileImageUrl ? (
                  <img 
                    src={avatarSrc!} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.error("Profile Image failed to load:", avatarSrc);
                      setImageError(true);
                    }}
                  />
                ) : (
                  <div className="text-5xl font-bold text-primary">{initial}</div>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-1 right-1 w-10 h-10 bg-primary rounded-full border-4 border-[#0a0a0a] flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{name}</h3>
              <p className="text-primary text-[10px] font-bold uppercase tracking-widest">@{formData.username}</p>
            </div>

            <div className="w-full pt-4 space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Online Status</span>
                <Switch checked={formData.isOnline} onCheckedChange={(val) => setFormData(prev => ({ ...prev, isOnline: val }))} />
              </div>
              <Button 
                variant="ghost" 
                onClick={() => { signOut(auth); router.push('/login'); }}
                className="w-full h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </Card>

          <Card className="glass p-8 border-white/5 rounded-[2rem] lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <input 
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="h-12 w-full bg-white/5 border border-white/5 rounded-xl px-4 text-white focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                  <div className="relative">
                    <input 
                      value={formData.username}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, username: val }));
                        handleCheckUsername(val);
                      }}
                      className={cn("h-12 w-full bg-white/5 border border-white/5 rounded-xl px-4 text-white focus:ring-1 focus:ring-primary text-sm", usernameStatus === 'taken' && "border-destructive")}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                      {usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      {usernameStatus === 'taken' && <span className="text-[8px] font-bold text-destructive">Taken</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">About Me</Label>
                <Textarea 
                  value={formData.about}
                  onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                  className="min-h-[100px] bg-white/5 border-white/10 rounded-xl resize-none text-sm"
                  placeholder="Digital creator on HappyChat..."
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSaving || usernameStatus === 'taken'}
                className="w-full h-14 bg-primary hover:glow-green-bright text-primary-foreground font-bold uppercase text-xs tracking-widest rounded-xl transition-all"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
