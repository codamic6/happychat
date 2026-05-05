
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, AtSign, Mail, Phone, Info, Camera, Loader2, 
  Save, CheckCircle2, ShieldCheck, LogOut, Settings, 
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
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

  const userRef = React.useMemo(() => (user ? doc(db, 'users', user.uid) : null), [db, user]);
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

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || profile.fullName || '',
        username: profile.username || '',
        about: profile.about || '',
        phoneNumber: profile.phoneNumber || '',
        isOnline: profile.isOnline ?? true
      });
    }
  }, [profile]);

  const handleCheckUsername = async (val: string) => {
    if (!val || val === profile?.username) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const q = query(collection(db, 'users'), where('username', '==', val.toLowerCase().trim()));
    const snap = await getDocs(q);
    setUsernameStatus(snap.empty ? 'available' : 'taken');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const megaFormData = new FormData();
    megaFormData.append('file', file);

    try {
      const result = await uploadProfileImageToMega(megaFormData);
      if ('url' in result) {
        await updateDoc(doc(db, 'users', user.uid), {
          profileImageUrl: result.url,
          updatedAt: serverTimestamp()
        });
        toast({ title: "Profile Image Updated", description: "Synced with MEGA storage successfully." });
      } else {
        toast({ variant: "destructive", title: "Upload Failed", description: result.error });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred during upload." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    if (usernameStatus === 'taken') {
      toast({ variant: "destructive", title: "Username Taken", description: "Please choose another handle." });
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        username: formData.username.toLowerCase().trim(),
        about: formData.about,
        phoneNumber: formData.phoneNumber,
        isOnline: formData.isOnline,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Profile Saved", description: "Your digital identity has been updated." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save profile changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isProfileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12">
        {/* Header Section */}
        <div className="space-y-4 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <Settings className="w-3 h-3" /> Identity Control Panel
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black font-headline italic tracking-tighter uppercase text-gradient">My Profile</h1>
          <p className="text-muted-foreground text-sm uppercase font-bold tracking-[0.3em]">Manage your neural identity across HappyChat</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Status */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass p-8 border-white/5 flex flex-col items-center text-center space-y-6 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="relative">
                  <Avatar className="w-40 h-40 md:w-48 md:h-48 border-4 border-primary/20 shadow-2xl transition-transform group-hover:scale-105 duration-500">
                    <AvatarImage src={profile?.profileImageUrl} />
                    <AvatarFallback className="bg-white/5 text-5xl font-black">{profile?.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-2 right-2 w-12 h-12 bg-primary rounded-full border-4 border-[#0a0a0a] glow-green flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform active:scale-95"
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <h3 className="text-xl font-bold font-headline italic uppercase text-white">{formData.displayName || 'Unnamed User'}</h3>
                <p className="text-primary text-[10px] font-black uppercase tracking-widest">@{formData.username || 'username'}</p>
              </div>

              <div className="w-full pt-4 space-y-4 relative z-10">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", formData.isOnline ? "bg-primary glow-green" : "bg-muted-foreground")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Online Status</span>
                  </div>
                  <Switch 
                    checked={formData.isOnline} 
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isOnline: val }))}
                  />
                </div>
                
                <Button 
                  variant="ghost" 
                  onClick={handleSignOut}
                  className="w-full h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-black uppercase text-[10px] tracking-widest border border-transparent hover:border-destructive/20"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out Session
                </Button>
              </div>
            </Card>

            <Card className="glass p-6 border-white/5 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Security Status</span>
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed">Your account is secured with E2E Neural Encryption. Recovery keys are managed by your device.</p>
            </Card>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="space-y-6">
              <Card className="glass p-8 md:p-10 border-white/5 rounded-[2.5rem] space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Display Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="h-14 bg-white/5 border-white/5 pl-12 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Username</Label>
                    <div className="relative group">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        value={formData.username}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, username: val }));
                          handleCheckUsername(val);
                        }}
                        className={cn(
                          "h-14 bg-white/5 border-white/5 pl-12 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all",
                          usernameStatus === 'taken' && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder="e.g. johndoe"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                        {usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        {usernameStatus === 'taken' && <span className="text-[8px] font-bold text-destructive">TAKEN</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email (Immutable)</Label>
                    <div className="relative opacity-50">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={profile?.email || ''} 
                        readOnly 
                        className="h-14 bg-white/5 border-white/5 pl-12 rounded-xl cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Secure Line (Phone)</Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="h-14 bg-white/5 border-white/5 pl-12 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">About / Bio</Label>
                  <div className="relative group">
                    <Info className="absolute left-4 top-5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Textarea 
                      value={formData.about}
                      onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                      className="min-h-[120px] bg-white/5 border-white/5 pl-12 pt-4 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all resize-none"
                      placeholder="Tell the world about yourself..."
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit"
                    disabled={isSaving || usernameStatus === 'taken'}
                    className="w-full h-16 bg-primary hover:glow-green-bright text-primary-foreground font-black uppercase text-sm tracking-[0.3em] rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <Save className="w-5 h-5" /> Sync Profile Changes
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <div className="flex items-center justify-between px-4 opacity-50">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Version 2.0.9-Stable</p>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary">AI Neural Sync Active</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
