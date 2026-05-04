import { Sparkles, Check, Search, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function AiAssistantPreview() {
  return (
    <section id="ai" className="py-24 relative overflow-hidden">
      <div className="glow-orb top-1/2 left-[-10%] opacity-30" />
      
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="space-y-4">
              <Card className="glass p-6 border-white/10 hover:border-primary/30 transition-all max-w-md ml-auto translate-x-4 animate-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold">Assistant Summary</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The team discussed the Q3 roadmap. Key points: 1. Launch HappyChat AI by Sept 10th. 2. Implement E2E encryption for all group chats.
                </p>
              </Card>
              
              <Card className="glass p-6 border-white/10 hover:border-primary/30 transition-all max-w-md mr-auto animate-float delay-1000">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold">Search Query</span>
                </div>
                <div className="text-xs bg-white/5 rounded-lg p-3 italic text-muted-foreground mb-4">
                  "When was the deadline for the design doc?"
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Found: "August 15th, according to Sarah's message"</span>
                </div>
              </Card>

              <div className="flex gap-2 max-w-md ml-auto -translate-x-8">
                 {['That sounds good!', 'Can we meet at 5?', 'Send the link.'].map((reply, i) => (
                   <div key={i} className="px-4 py-2 rounded-full glass border border-primary/20 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer">
                     {reply}
                   </div>
                 ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-4xl md:text-5xl font-black font-headline">The Power of <span className="text-primary">AI</span> <br />At Your Fingertips</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Our futuristic AI assistant helps you stay productive. Get instant summaries of long conversations, 
              generate context-aware replies, and search through your entire history in seconds.
            </p>
            
            <ul className="space-y-4">
              {[
                'Contextual Smart Replies',
                'One-click Conversation Summaries',
                'Natural Language Message Search',
                'Tone Adjustment Suggestions'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}