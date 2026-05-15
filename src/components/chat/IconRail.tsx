'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, Globe, Users, UserCircle, 
  LogOut, UserPlus, Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { AddContactDialogContent } from '@/components/chat/AddContactDialogContent';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';

function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative group", className)}>
      <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
      <Image 
        src="/Logo.png" 
        alt="HappyChat Logo" 
        width={40} 
        height={40} 
        className="relative z-10 w-full h-full object-contain"
      />
    </div>
  );
}

export function IconRail() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const navItems = [
    { id: 'chats', icon: MessageSquare, label: 'Chats', path: '/chat' },
    { id: 'status', icon: Globe, label: 'Updates', path: '/chat/status' },
    { id: 'contacts', icon: Users, label: 'Contacts', path: '/chat/contacts' },
    { id: 'archived', icon: Archive, label: 'Archived', path: '/chat/archived' },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/chat' && pathname === '/chat') return true;
    if (path !== '/chat' && pathname.startsWith(path)) return true;
    return false;
  };

  const isProfileActive = pathname === '/chat/profile';

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="w-16 flex flex-col items-center py-6 border-r border-white/5 bg-[#0a0a0a] h-full z-50">
        <div className="mb-8">
          <div className="w-10 h-10 cursor-pointer" onClick={() => router.push('/')}>
            <BrandLogo className="w-full h-full" />
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
              <TooltipContent side="right" className="bg-[#111] border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary">
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
              <TooltipContent side="right" className="bg-[#111] border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary">
                Add Contact
              </TooltipContent>
              <AddContactDialogContent onSuccess={() => setIsAddContactOpen(false)} currentUserId={user?.uid} />
            </Tooltip>
          </Dialog>
        </div>
        
        <div className="flex flex-col gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" variant="ghost" 
                onClick={() => router.push('/chat/profile')}
                className={cn(
                  "rounded-xl transition-all relative group",
                  isProfileActive ? "bg-primary/20 text-primary glow-green" : "text-muted-foreground hover:text-white"
                )}
              >
                <UserCircle className="w-5 h-5" />
                {isProfileActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#111] border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary">
              Profile
            </TooltipContent>
          </Tooltip>

          <Button size="icon" variant="ghost" onClick={handleSignOut} className="rounded-xl text-muted-foreground hover:text-destructive transition-colors"><LogOut className="w-5 h-5" /></Button>
        </div>
      </nav>
    </TooltipProvider>
  );
}
