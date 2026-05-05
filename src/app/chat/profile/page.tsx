'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, AtSign, Mail, Phone, Info, Camera, Loader2, 
  Save, CheckCircle2, ShieldCheck, LogOut, Settings, 
  Sparkles, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(`[PROFILE DEBUG] ${msg}`);
    setDebugLogs(prev => [...prev.slice(-10), `> ${msg}`]);
  };

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

    addLog(`INIT: Preparing upload for "${file.name}"`);
    setIsUploading(true);
    const megaFormData = new FormData();
    megaFormData.append('file', file);

    try {
      addLog('ACTION: Calling MEGA Secure Sync...');
      const result = await uploadProfileImageToMega(megaFormData);
      
      if ('url' in result) {
        addLog(`SUCCESS: Public Link -> ${result.url.substring(0, 30)}...`);
        const userDocRef = doc(db, 'users', user.uid);
        
        addLog('FIRESTORE: Updating Identity Record...');
        await updateDoc(userDocRef, {
          profileImageUrl: result.url,
          updatedAt: serverTimestamp()
        });

        addLog('SYNC: Identity Synchronized ✅');
        toast({ title: "Identity Updated", description: "Profile photo is now live globally." });
      } else {
        addLog(`CRITICAL ERROR: ${result.error}`);
        toast({ 
          variant: "destructive", 
          title: "Cloud Error", 
          description: result.error || "MEGA upload failed. Check environment variables." 
        });
      }
    } catch (err: any) {
      addLog(`FATAL: ${err.message}`);
      toast({ variant: "destructive", title: "Pipeline Error", description: "Communication with MEGA failed." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving || !db) return;

    if (usernameStatus === 'taken') {
      toast({ variant: "destructive", title: "ID Conflict", description: "Username already claimed." });
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
      toast({ title: "Protocol Updated", description: "Digital identity synchronized." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not sync identity data." });
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

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12 pb-32">
        <div className="space-y-4 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <Settings className="w-3 h-3" /> Identity Management
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black font-headline italic tracking-tighter uppercase text-gradient">My Profile</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass p-8 border-white/5 flex flex-col items-center text-center space-y-6 rounded-[2.5rem] relative overflow-hidden group">
              <div className="relative">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-primary/20 shadow-2xl bg-[#0d0d0d] overflow-hidden">
                  {profile?.profileImageUrl ? (
                    <img 
                      src={`${profile.profileImageUrl}${profile.profileImageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black bg-white/5">
                      {profile?.displayName?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-2 right-2 w-12 h-12 bg-primary rounded-full border-4 border-[#0a0a0a] glow-green flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
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

              <div className="space-y-1">
                <h3 className="text-xl font-bold font-headline italic uppercase text-white">{formData.displayName || 'Unnamed User'}</h3>
                <p className="text-primary text-[10px] font-black uppercase tracking-widest">@{formData.username || 'username'}</p>
              </div>

              {/* Enhanced Debug Console */}
              <div className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-left space-y-2">
                <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase">
                  <Terminal className="w-3 h-3 text-primary" /> Sync Pipeline Output
                </div>
                <div className="space-y-1 max-h-[120px] overflow-y-auto no-scrollbar">
                  {debugLogs.length === 0 && <p className="text-[8px] text-muted-foreground italic">System Idle</p>}
                  {debugLogs.map((log, i) => (
                    <p key={i} className="text-[8px] font-code text-primary leading-tight truncate">{log}</p>
                  ))}
                </div>
              </div>

              <div className="w-full pt-4 space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Online Presence</span>
                  <Switch 
                    checked={formData.isOnline} 
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isOnline: val }))}
                  />
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => { signOut(auth); router.push('/login'); }}
                  className="w-full h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-black uppercase text-[10px] tracking-widest"
                >
                  <LogOut className="w-4 h-4 mr-2" /> End Neural Link
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="space-y-6">
              <Card className="glass p-8 md:p-10 border-white/5 rounded-[2.5rem] space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Display Name</Label>
                    <Input 
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="h-14 bg-white/5 border-white/5 rounded-xl focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Username</Label>
                    <div className="relative">
                      <Input 
                        value={formData.username}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, username: val }));
                          handleCheckUsername(val);
                        }}
                        className={cn("h-14 bg-white/5 border-white/5 rounded-xl", usernameStatus === 'taken' && "border-destructive")}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                        {usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        {usernameStatus === 'taken' && <span className="text-[8px] font-bold text-destructive">Claimed</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Secure Line (Phone)</Label>
                    <Input 
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="h-14 bg-white/5 border-white/5 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Account Email</Label>
                    <Input value={profile?.email || ''} readOnly className="h-14 bg-white/5 border-white/5 rounded-xl opacity-50 cursor-not-allowed" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Bio / Objective</Label>
                  <Textarea 
                    value={formData.about}
                    onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                    className="min-h-[120px] bg-white/5 border-white/10 rounded-xl resize-none"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSaving || usernameStatus === 'taken'}
                  className="w-full h-16 bg-primary hover:glow-green-bright text-primary-foreground font-black uppercase text-sm tracking-[0.3em] rounded-2xl transition-all"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sync Global Identity'}
                </Button>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
