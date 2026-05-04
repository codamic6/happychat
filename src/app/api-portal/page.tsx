import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Code, Terminal, Zap, Lock } from 'lucide-react';

export default function ApiPortalPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="pt-32 pb-20 container mx-auto px-6">
        <div className="max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-black font-headline mb-6 text-gradient">Developer API</h1>
          <p className="text-xl text-muted-foreground">Build the next generation of secure communication apps using our robust, developer-friendly API.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="glass p-8 border-white/10">
            <Terminal className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Quick Integration</h3>
            <p className="text-muted-foreground mb-4">Start sending your first secure message in under 5 minutes with our lightweight SDKs.</p>
            <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-primary border border-white/5">
              npm install @happychat/sdk
            </div>
          </Card>
          <Card className="glass p-8 border-white/10">
            <Lock className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">E2E Native</h3>
            <p className="text-muted-foreground">Encryption is built-in. Your app users get the same world-class security as our official clients.</p>
          </Card>
        </div>

        <div className="glass p-12 rounded-3xl border border-white/10">
          <h2 className="text-3xl font-bold mb-8 text-center">API Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <Zap className="w-8 h-8 text-primary mx-auto" />
              <h4 className="font-bold">Real-time Webhooks</h4>
              <p className="text-sm text-muted-foreground">Get instant notifications for messages, calls, and user status changes.</p>
            </div>
            <div className="space-y-4">
              <Code className="w-8 h-8 text-primary mx-auto" />
              <h4 className="font-bold">Rich Media Support</h4>
              <p className="text-sm text-muted-foreground">Seamlessly handle images, video, and large file attachments.</p>
            </div>
            <div className="space-y-4">
              <Terminal className="w-8 h-8 text-primary mx-auto" />
              <h4 className="font-bold">AI Endpoints</h4>
              <p className="text-sm text-muted-foreground">Access our summarization and suggestion engines via API.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}