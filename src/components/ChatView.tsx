"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Paperclip, Smile, Phone, Video, Info, Search, Sparkles, ChevronRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'Alex', text: 'Hey, did you see the new design for HappyChat?', timestamp: '10:02 AM', isMe: false },
    { id: 2, sender: 'Me', text: 'Not yet! Is it the dark mode focus?', timestamp: '10:03 AM', isMe: true },
    { id: 3, sender: 'Alex', text: 'Yeah, pure black with green accents. Looks futuristic.', timestamp: '10:04 AM', isMe: false },
  ]);
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    updateSuggestions();
  }, [messages]);

  const updateSuggestions = async () => {
    const history = messages.map(m => ({ sender: m.sender, text: m.text }));
    const result = await generateSmartReplySuggestions({ conversationHistory: history });
    if (result && result.suggestions) {
      setSuggestions(result.suggestions);
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

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0d0d0d] rounded-2xl border border-white/5 overflow-hidden glass">
        <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-10 h-10 border border-primary/20">
              <AvatarImage src="https://picsum.photos/seed/alex/100/100" />
              <AvatarFallback>AL</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-white">Alex Morgan</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Phone className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Video className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary"><Info className="w-5 h-5" /></Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] group relative ${msg.isMe ? 'order-2' : ''}`}>
                   <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                     msg.isMe 
                      ? 'bg-primary text-primary-foreground font-medium glow-green' 
                      : 'bg-[#161616] text-white border border-white/5'
                   }`}>
                     {msg.text}
                   </div>
                   <div className={`text-[10px] text-muted-foreground mt-1 px-1 ${msg.isMe ? 'text-right' : ''}`}>
                     {msg.timestamp}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Suggestion Bar */}
        {suggestions.length > 0 && (
          <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar">
            {suggestions.map((suggestion, i) => (
              <button 
                key={i} 
                onClick={() => handleSendMessage(suggestion)}
                className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-primary hover:bg-primary/20 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <footer className="p-4 bg-black/40 border-t border-white/5">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white shrink-0"><Paperclip className="w-5 h-5" /></Button>
            <div className="flex-1 relative">
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                placeholder="Type a secure message..."
                className="bg-[#161616] border-white/5 h-12 pl-4 pr-12 focus-visible:ring-primary focus-visible:ring-offset-0"
              />
              <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"><Smile className="w-5 h-5" /></Button>
            </div>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-white shrink-0"><Mic className="w-5 h-5" /></Button>
            <Button 
              onClick={() => handleSendMessage(inputText)}
              className="bg-primary hover:glow-green-bright text-primary-foreground h-12 w-12 rounded-xl"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </footer>
      </div>

      {/* AI Assistant Side Panel */}
      <aside className="w-80 flex flex-col gap-6">
        <Card className="bg-[#0d0d0d] border-white/5 flex-1 flex flex-col p-6 overflow-hidden glass">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-green">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-white">AI Assistant</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ready to assist</p>
            </div>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              <div className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                <span>CONVERSATION SUMMARY</span>
                <button 
                  onClick={handleSummarize}
                  className="text-primary hover:underline"
                >
                  Generate
                </button>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-h-[100px] text-xs leading-relaxed text-muted-foreground">
                {summary || "Click generate to summarize the current conversation."}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-bold text-muted-foreground">AI SEARCH</div>
              <div className="relative">
                <Input 
                  placeholder="Ask anything..."
                  className="bg-white/5 border-white/10 text-xs h-10 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:text-primary"
                  onClick={handleAiSearch}
                  disabled={isAiSearching}
                >
                  {isAiSearching ? <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {searchResult && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs leading-relaxed text-primary">
                  {searchResult}
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Security Level</span>
              <span className="text-primary font-bold">MAXIMUM</span>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}