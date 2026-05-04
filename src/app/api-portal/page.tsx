import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, Code, Cpu, Sparkles } from 'lucide-react';

export default function ApiPortalPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="pt-32 pb-20 container mx-auto px-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black tracking-widest uppercase mb-8 animate-pulse">
          <Terminal className="w-4 h-4" /> API Access
        </div>
        
        <div className="max-w-3xl text-center space-y-6 mb-12">
          <h1 className="text-5xl md:text-8xl font-black font-headline text-gradient">Coming <br /><span className="text-primary">Soon.</span></h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're building the most powerful, secure communication API ever designed. 
            Stay tuned for the developer SDK, real-time webhooks, and AI endpoints.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/10 max-w-lg w-full space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Get Notified</h3>
            <p className="text-sm text-muted-foreground">Join the waitlist to get early access to our private beta.</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="developer@example.com" className="bg-white/5 border-white/10" />
            <Button className="glow-green font-bold">Join Waitlist</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 w-full max-w-4xl opacity-50">
          <div className="flex flex-col items-center gap-3">
            <Code className="w-6 h-6 text-primary" />
            <span className="text-xs font-bold uppercase tracking-tighter">TypeScript SDK</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Cpu className="w-6 h-6 text-primary" />
            <span className="text-xs font-bold uppercase tracking-tighter">Edge Logic</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xs font-bold uppercase tracking-tighter">AI Ready</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Terminal className="w-6 h-6 text-primary" />
            <span className="text-xs font-bold uppercase tracking-tighter">Rest API</span>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
