import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AiAssistantPreview } from '@/components/AiAssistantPreview';
import { Sparkles, Brain, Cpu, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AiAssistantPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="pt-32">
        <div className="container mx-auto px-6 mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black tracking-widest uppercase mb-6">
            <Sparkles className="w-4 h-4" /> The Future of Chat
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-headline mb-6 text-gradient">AI Powered. <br />Privacy First.</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Experience a smarter way to communicate with integrated AI that assists without spying.</p>
        </div>

        <AiAssistantPreview />

        <section className="py-24 bg-[#0d0d0d]">
          <div className="container mx-auto px-6">
             <div className="grid md:grid-cols-3 gap-8">
                <Card className="glass p-8 border-white/10 space-y-4">
                  <Brain className="w-12 h-12 text-primary" />
                  <h3 className="text-2xl font-bold">Deep Context</h3>
                  <p className="text-muted-foreground">Our AI understands the nuances of your conversations, providing summaries that actually make sense.</p>
                </Card>
                <Card className="glass p-8 border-white/10 space-y-4">
                  <Cpu className="w-12 h-12 text-primary" />
                  <h3 className="text-2xl font-bold">On-Edge Logic</h3>
                  <p className="text-muted-foreground">Processing happens with maximum security, ensuring your raw data never touches third-party servers.</p>
                </Card>
                <Card className="glass p-8 border-white/10 space-y-4">
                  <MessageSquare className="text-primary w-12 h-12" />
                  <h3 className="text-2xl font-bold">Smart Reply 2.0</h3>
                  <p className="text-muted-foreground">Go beyond 'Yes' and 'No'. Get full sentences that match your tone and style perfectly.</p>
                </Card>
             </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}