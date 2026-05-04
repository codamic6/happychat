import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { AiAssistantPreview } from '@/components/AiAssistantPreview';
import { SecurityFocus } from '@/components/SecurityFocus';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] selection:bg-primary/30">
      <Navbar />
      <Hero />
      <Features />
      <SecurityFocus />
      <AiAssistantPreview />
      
      {/* Footer / Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="glow-orb top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="glass p-12 md:p-20 rounded-[3rem] border border-white/10 space-y-8 max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tight">Ready to join the <br /><span className="text-primary">HappyChat</span> revolution?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The smartest, most secure way to stay connected is just a click away.
              Start chatting for free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-16 px-10 text-xl font-bold glow-green">Get Started Now</Button>
              <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold">Learn More</Button>
            </div>
          </div>
          
          <footer className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center glow-green">
                <MessageSquare className="text-primary-foreground h-3 w-3" />
              </div>
              <span className="font-bold text-white">HappyChat</span>
            </div>
            
            <div className="flex items-center gap-8">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Help</a>
              <a href="#" className="hover:text-white transition-colors">API</a>
            </div>
            
            <p>© 2024 HappyChat Inc. All rights reserved.</p>
          </footer>
        </div>
      </section>
    </main>
  );
}