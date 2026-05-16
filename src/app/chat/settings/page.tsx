'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings as SettingsIcon, Shield, Bell, Eye, Lock, 
  Smartphone, Globe, ArrowLeft, ChevronRight, Loader2,
  Keyboard, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

type UserProfile = {
  id: string;
  showOnlineStatus?: boolean;
  showTypingStatus?: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  const userRef = useMemo(() => (user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);

  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    showTypingStatus: true,
  });

  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setSettings({
        showOnlineStatus: profile.showOnlineStatus ?? true,
        showTypingStatus: profile.showTypingStatus ?? true,
      });
    }
  }, [profile]);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    if (!user || !db) return;
    
    setIsUpdating(key);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [key]: value,
        updatedAt: serverTimestamp()
      });
      setSettings(prev => ({ ...prev, [key]: value }));
      toast({ 
        title: "Preference Saved", 
        description: "Your privacy shard has been updated." 
      });
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: "Could not sync with the nexus." 
      });
    } finally {
      setIsUpdating(null);
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
    <div className="flex-1 flex flex-col bg-[#050505] h-full overflow-hidden">
      <header className="h-24 px-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-xl z-[60] sticky top-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="text-white/60 hover:text-white rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black font-headline text-gradient tracking-tight uppercase">Settings</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Protocol Configurations</p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12 pb-32">
          {/* Privacy Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Privacy & Signal</h3>
            <div className="grid gap-4">
              <Card className="glass p-6 border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:glow-green transition-all">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-tight text-sm font-headline">Online Visibility</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Let others see when you are active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isUpdating === 'showOnlineStatus' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  <Switch 
                    checked={settings.showOnlineStatus} 
                    onCheckedChange={(val) => handleToggle('showOnlineStatus', val)} 
                  />
                </div>
              </Card>

              <Card className="glass p-6 border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:glow-green transition-all">
                    <Keyboard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-tight text-sm font-headline">Typing Indicator</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Show 'Typing...' when you write</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isUpdating === 'showTypingStatus' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  <Switch 
                    checked={settings.showTypingStatus} 
                    onCheckedChange={(val) => handleToggle('showTypingStatus', val)} 
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* Interface Section (Static Mockup) */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">App Interface</h3>
            <div className="grid gap-4">
              <Card className="glass p-6 border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:glow-green transition-all">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-tight text-sm font-headline">Push Notifications</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Alerts for incoming signals</p>
                  </div>
                </div>
                <Switch defaultChecked={true} disabled />
              </Card>

              <Card className="glass p-6 border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:glow-green transition-all">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-tight text-sm font-headline">Haptic Feedback</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Vibration on interactions</p>
                  </div>
                </div>
                <Switch defaultChecked={true} disabled />
              </Card>
            </div>
          </div>

          <div className="pt-12 text-center opacity-30">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white italic underline">Secure System v1.0.2 Stable</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
