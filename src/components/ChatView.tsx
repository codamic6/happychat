
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, Paperclip, Smile, Search, 
  Sparkles, MessageSquare, User, AtSign, Settings, LogOut,
  Plus, MoreVertical, X, Users, Globe, UserCircle, ShieldCheck, Mail, Phone, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, doc, onSnapshot, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
};

type UserProfile = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  profileImageUrl: string;
  about?: string;
};

export function ChatView() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'chats' | 'status' | 'contacts' | 'profile' | 'happyai' | 'settings'>('chats');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [inputText, setInputText] = useState('');

  // Fetch all users except current user for contacts/chat list
  const usersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users'), limit(50));
  }, [db, user]);

  const { data: allUsers } = useCollection<UserProfile>(usersQuery);

  // Selected User Data
  const selectedUser = useMemo(() => {
    return allUsers?.find(u => u.id === selectedUserId) || null;
  }, [allUsers, selectedUserId]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !selectedUserId) return;
    // In a real app, we would add to Firestore here
    // For now, we update local state or just clear input as mockup data is removed
    setInputText('');
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="flex h-full bg-[#050505] text-white">
      {/* Rail Navigation (Leftmost) */}
      <nav className="w-16 flex flex-col items-center py-6 border-r border-white/5 bg-[#0a0a0a]">
        <div className="flex flex-col gap-6 flex-1">
          <Button 
            size="icon" variant="ghost" 
            onClick={() => setActiveTab('chats')}
            className={`rounded-xl transition-all ${activeTab === 'chats' ? 'bg-primary/20 text-primary glow-green' : 'text-muted-foreground hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" variant="ghost" 
            onClick={() => setActiveTab('status')}
            className={`rounded-xl transition-all ${activeTab === 'status' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            <Globe className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" variant="ghost" 
            onClick={() => setActiveTab('contacts')}
            className={`rounded-xl transition-all ${activeTab === 'contacts' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" variant="ghost" 
            onClick={() => setActiveTab('happyai')}
            className={`rounded-xl transition-all ${activeTab === 'happyai' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            <Sparkles className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <Button 
            size="icon" variant="ghost" 
            onClick={() => setActiveTab('profile')}
            className={`rounded-xl transition-all ${activeTab === 'profile' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            <UserCircle className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" variant="ghost" 
            onClick={() => setActiveTab('settings')}
            className={`rounded-xl transition-all ${activeTab === 'settings' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" variant="ghost" 
            onClick={handleSignOut}
            className="rounded-xl text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Sidebar - Chat/Contact List */}
      <aside className="w-80 border-r border-white/5 flex flex-col bg-[#0d0d0d]">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black font-headline text-white italic tracking-tighter uppercase">
              {activeTab === 'chats' ? 'Recent Chats' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <Button size="icon" variant="ghost" className="rounded-xl hover:bg-primary/10 hover:text-primary"><Plus className="w-5 h-5" /></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="bg-white/5 border-white/5 pl-10 h-10 text-xs rounded-xl focus-visible:ring-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 pb-6 space-y-1">
            {allUsers?.filter(u => u.id !== user?.uid).map((contact) => (
              <button 
                key={contact.id}
                onClick={() => {
                  setSelectedUserId(contact.id);
                  setShowUserDetail(false);
                }}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${selectedUserId === contact.id ? 'bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(0,200,83,0.1)]' : 'hover:bg-white/5'}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-12 h-12 border border-white/10">
                    <AvatarImage src={contact.profileImageUrl} />
                    <AvatarFallback>{contact.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-[#0a0a0a] glow-green" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm text-white truncate">{contact.fullName}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">@{contact.username}</p>
                </div>
              </button>
            ))}
            {(!allUsers || allUsers.length <= 1) && (
              <div className="p-6 text-center text-muted-foreground text-xs italic">
                No active conversations found.
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Chat Feed */}
      <div className="flex-1 flex flex-col bg-[#050505]">
        {selectedUser ? (
          <>
            <header 
              className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setShowUserDetail(!showUserDetail)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10 border border-primary/20">
                  <AvatarImage src={selectedUser.profileImageUrl} />
                  <AvatarFallback>{selectedUser.fullName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedUser.fullName}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-primary uppercase font-black tracking-widest">Active Now</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Search className="w-5 h-5" /></Button>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
              </div>
            </header>

            <ScrollArea className="flex-1 p-6 relative">
              <div className="max-w-4xl mx-auto space-y-8 pb-12 flex flex-col items-center justify-center h-full opacity-30">
                <Sparkles className="w-16 h-16 text-primary/50 animate-pulse" />
                <p className="text-sm font-black uppercase tracking-widest italic">Start a secure conversation with {selectedUser.fullName.split(' ')[0]}</p>
              </div>
            </ScrollArea>

            <footer className="p-6 bg-[#0a0a0a] border-t border-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-4 max-w-5xl mx-auto">
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white shrink-0"><Paperclip className="w-5 h-5" /></Button>
                <div className="flex-1 relative">
                  <Input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                    placeholder={`Message ${selectedUser.fullName}...`}
                    className="bg-[#111] border-white/10 h-14 pl-5 pr-14 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
                  />
                  <Button size="icon" variant="ghost" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"><Smile className="w-5 h-5" /></Button>
                </div>
                <Button 
                  onClick={() => handleSendMessage(inputText)}
                  className="bg-primary hover:glow-green-bright text-primary-foreground h-14 w-14 rounded-2xl shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-20">
             <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center glow-green border border-primary/20">
               <MessageSquare className="w-12 h-12 text-primary" />
             </div>
             <p className="text-sm font-black uppercase tracking-[0.5em] italic">Select a conversation to begin</p>
          </div>
        )}
      </div>

      {/* User Detail Panel (Right Side) */}
      <AnimatePresence>
        {showUserDetail && selectedUser && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-white/5 bg-[#0a0a0a] flex flex-col overflow-hidden relative"
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">User Details</h3>
                <Button size="icon" variant="ghost" onClick={() => setShowUserDetail(false)} className="h-8 w-8 rounded-full"><X className="w-4 h-4" /></Button>
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-2xl">
                    <AvatarImage src={selectedUser.profileImageUrl} />
                    <AvatarFallback className="text-4xl">{selectedUser.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-primary rounded-full border-4 border-[#0a0a0a] glow-green" />
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-black font-headline italic tracking-tighter uppercase">{selectedUser.fullName}</h2>
                  <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Active Now</p>
                </div>

                <Card className="w-full bg-white/5 border-white/5 p-4 space-y-4">
                  <div className="flex items-center gap-4 text-left">
                    <Info className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">About</p>
                      <p className="text-xs text-white italic">{selectedUser.about || "Digital creator using HappyChat Protocol v2.0."}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-left">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Phone</p>
                      <p className="text-xs text-white">{selectedUser.phoneNumber || "No phone listed"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-left">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                      <p className="text-xs text-white truncate max-w-[180px]">{selectedUser.email}</p>
                    </div>
                  </div>
                </Card>

                <div className="w-full pt-8 space-y-4">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter text-muted-foreground px-1">
                     <span>Security Integrity</span>
                     <span className="text-primary">VERIFIED</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.5 }}
                        className="h-full bg-primary glow-green" 
                      />
                   </div>
                </div>
              </div>

              <div className="mt-auto pt-6 flex justify-center gap-4">
                 <div className="flex flex-col items-center gap-2">
                   <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all cursor-pointer">
                     <ShieldCheck className="w-5 h-5" />
                   </div>
                   <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Verify</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-all cursor-pointer">
                     <X className="w-5 h-5" />
                   </div>
                   <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Block</span>
                 </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
