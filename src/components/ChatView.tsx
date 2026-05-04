
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, Paperclip, Smile, Phone, Video, Info, Search, 
  Sparkles, MessageSquare, User, AtSign, Settings, LogOut,
  ChevronRight, Circle, MoreVertical, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { generateSmartReplySuggestions } from '@/ai/flows/generate-smart-reply-suggestions';
import { summarizeConversation } from '@/ai/flows/summarize-conversation-flow';
import { aiSearchAndInformationRetrieval } from '@/ai/flows/ai-search-and-information-retrieval';

type Message = {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  isMe: boolean;
};

type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  online: boolean;
  avatar: string;
};

export function ChatView() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'Alex', text: 'Hey! Ready for the AI demo?', timestamp: '10:02 AM', isMe: false },
    { id: 2, sender: 'Me', text: 'Absolutely. Let\'s test the real-time sync.', timestamp: '10:03 AM', isMe: true },
    { id: 3, sender: 'Alex', text: 'Perfect. I\'ve deployed the new security protocol.', timestamp: '10:04 AM', isMe: false },
  ]);
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');

  const chats: Chat[] = [
    { id: '1', name: 'Alex Morgan', lastMessage: 'Perfect. I\'ve deployed...', time: '10:04 AM', online: true, avatar: 'https://picsum.photos/seed/alex/100/100' },
    { id: '2', name: 'Design Team', lastMessage: 'Sarah: Check the new glass...', time: 'Yesterday', online: false, avatar: 'https://picsum.photos/seed/team/100/100' },
    { id: '3', name: 'James Wilson', lastMessage: 'See you at the meeting.', time: 'Monday', online: true, avatar: 'https://picsum.photos/seed/james/100/100' },
  ];

  useEffect(() => {
    updateSuggestions();
  }, [messages]);

  const updateSuggestions = async () => {
    const history = messages.map(m => ({ sender: m.sender, text: m.text }));
    try {
      const result = await generateSmartReplySuggestions({ conversationHistory: history });
      if (result && result.suggestions) setSuggestions(result.suggestions);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    const newMessage: Message = {
      id: messages.length + 1,
      sender: 'Me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleSummarize = async () => {
    const conversationText = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const result = await summarizeConversation({ conversation: conversationText });
    setSummary(result.summary);
  };

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    const history = messages.map(m => ({ 
      role: m.isMe ? 'user' as const : 'model' as const, 
      content: m.text 
    }));
    const result = await aiSearchAndInformationRetrieval({ query: searchQuery, conversationHistory: history });
    setSearchResult(result);
    setIsAiSearching(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-64px)] bg-[#050505]">
      {/* Sidebar - Chat List */}
      <aside className="w-80 border-r border-white/5 flex flex-col glass bg-[#0a0a0a]/50">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black font-headline text-white italic tracking-tighter uppercase">Messages</h2>
            <Button size="icon" variant="ghost" className="rounded-xl hover:bg-primary/10 hover:text-primary"><Plus className="w-5 h-5" /></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="bg-white/5 border-white/5 pl-10 h-10 text-xs rounded-xl focus-visible:ring-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 pb-6 space-y-1">
            {chats.map((chat) => (
              <button 
                key={chat.id}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${chat.id === '1' ? 'bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(0,200,83,0.1)]' : 'hover:bg-white/5'}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-12 h-12 border border-white/10">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-[#0a0a0a] glow-green" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm text-white truncate">{chat.name}</span>
                    <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/5 mt-auto">
          <div className="glass p-3 rounded-2xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-xs font-bold text-white truncate max-w-[100px]">{user?.displayName || 'User'}</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white"><Settings className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={handleSignOut} className="h-8 w-8 text-muted-foreground hover:text-destructive"><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Feed */}
      <div className="flex-1 flex flex-col bg-black/20">
        <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Avatar className="w-10 h-10 border border-primary/20">
              <AvatarImage src="https://picsum.photos/seed/alex/100/100" />
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-bold text-white">Alex Morgan</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-primary uppercase font-black tracking-widest">Encrypted Line</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Phone className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Video className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Info className="w-5 h-5" /></Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="text-center">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-muted-foreground uppercase tracking-widest">Security verified ● {new Date().toLocaleDateString()}</span>
            </div>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] group relative ${msg.isMe ? 'order-2' : ''}`}>
                   <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-xl ${
                     msg.isMe 
                      ? 'bg-primary text-primary-foreground font-medium glow-green' 
                      : 'bg-[#161616] text-white border border-white/5'
                   }`}>
                     {msg.text}
                   </div>
                   <div className={`text-[9px] text-muted-foreground mt-1.5 flex items-center gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                     <span className="font-bold uppercase tracking-tighter opacity-50">{msg.timestamp}</span>
                     {msg.isMe && <span className="text-primary font-black">● SENT</span>}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <footer className="p-6 bg-black/60 border-t border-white/5 backdrop-blur-xl">
          {suggestions.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {suggestions.map((suggestion, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSendMessage(suggestion)}
                  className="whitespace-nowrap px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-primary hover:bg-primary/20 transition-all uppercase tracking-widest"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white shrink-0"><Paperclip className="w-5 h-5" /></Button>
            <div className="flex-1 relative">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                placeholder="Type a secure message..."
                className="bg-[#111] border-white/10 h-14 pl-5 pr-14 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
              />
              <Button size="icon" variant="ghost" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"><Smile className="w-5 h-5" /></Button>
            </div>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white shrink-0 h-14 w-14 rounded-2xl"><Mic className="w-5 h-5" /></Button>
            <Button 
              onClick={() => handleSendMessage(inputText)}
              className="bg-primary hover:glow-green-bright text-primary-foreground h-14 w-14 rounded-2xl shadow-lg"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </footer>
      </div>

      {/* AI Panel */}
      <aside className="w-80 border-l border-white/5 flex flex-col glass bg-[#0a0a0a]/50">
        <div className="p-6 h-full flex flex-col space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center glow-green border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AI Copilot</h3>
              <p className="text-[10px] text-primary uppercase font-black tracking-widest">Neural Link Active</p>
            </div>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
            <Card className="bg-white/5 border-white/10 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Briefing</span>
                <Button 
                  onClick={handleSummarize}
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10"
                >
                  Generate
                </Button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                {summary || "Generate a neural summary of your current session."}
              </p>
            </Card>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block px-1">Neural Search</span>
              <div className="relative">
                <Input 
                  placeholder="Query your history..."
                  className="bg-white/5 border-white/10 text-xs h-12 pr-10 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:text-primary transition-colors"
                  onClick={handleAiSearch}
                  disabled={isAiSearching}
                >
                  {isAiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {searchResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-[11px] leading-relaxed text-primary font-medium"
                >
                  {searchResult}
                </motion.div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
              <span className="text-muted-foreground">Network Integrity</span>
              <span className="text-primary">100% SECURE</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-full bg-primary glow-green" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
