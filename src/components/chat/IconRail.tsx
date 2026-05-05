'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, Globe, Users, Sparkles, UserCircle, 
  Settings, LogOut, UserPlus, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { AddContactDialogContent } from '@/components/chat/AddContactDialogContent';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export function IconRail() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const navItems = [
    { id: 'chats', icon: MessageSquare, label: 'Recent Chats', path: '/chat' },
    { id: 'status', icon: Globe, label: 'Status Updates', path: '/status' },
    { id: 'contacts', icon: Users, label: 'Contacts', path: '/contacts' },
    { id: 'ai', icon: Sparkles, label: 'HappyAI', path: '/ai-assistant' },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="w-16 flex flex-col items-center py-6 border-r border-white/5 bg-[#0a0a0a] h-full">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-green cursor-pointer" onClick={() => router.push('/')}>
            <Zap className="text-primary-foreground h-6 w-6 fill-current" />
          </div>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" variant="ghost" 
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "rounded-xl transition-all relative group",
                    isActive(item.path) ? "bg-primary/20 text-primary glow-green" : "text-muted-foreground hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {isActive(item.path) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#111] border-white/10 text-xs font-bold uppercase tracking-widest text-primary">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}

          <div className="h-px w-8 bg-white/5 mx-auto my-2" />

          <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
            <Tooltip>
              <DialogTrigger asChild>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" variant="ghost" 
                    className="rounded-xl text-primary hover:bg-primary/20 hover:glow-green transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
              </DialogTrigger>
              <TooltipContent side="right" className="bg-[#111] border-white/10 text-xs font-bold uppercase tracking-widest text-primary">
                Add Contact
              </TooltipContent>
            </Tooltip>
            <AddContactDialogContent onSuccess={() => setIsAddContactOpen(false)} currentUserId={user?.uid} />
          </Dialog>
        </div>
        
        <div className="flex flex-col gap-4">
          <Button size="icon" variant="ghost" className="rounded-xl text-muted-foreground hover:text-white"><UserCircle className="w-5 h-5" /></Button>
          <Button size="icon" variant="ghost" className="rounded-xl text-muted-foreground hover:text-white"><Settings className="w-5 h-5" /></Button>
          <Button size="icon" variant="ghost" onClick={handleSignOut} className="rounded-xl text-muted-foreground hover:text-destructive"><LogOut className="w-5 h-5" /></Button>
        </div>
      </nav>
    </TooltipProvider>
  );
}
