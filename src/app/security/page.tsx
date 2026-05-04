import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SecurityFocus } from '@/components/SecurityFocus';
import { Lock, ShieldCheck, Fingerprint, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="pt-32">
        <div className="container mx-auto px-6 mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black tracking-widest uppercase mb-6">
              <ShieldCheck className="w-4 h-4" /> Military-Grade Security
            </div>
            <h1 className="text-5xl md:text-7xl font-black font-headline mb-6 text-gradient">Your Data is Yours. <br />Period.</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">We use state-of-the-art cryptographic protocols to ensure that not even we can read your conversations.</p>
          </div>
        </div>

        <SecurityFocus />

        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-12 text-center">Security Layers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Lock, title: "Signal Protocol", desc: "Industry standard E2E encryption for all messages." },
                { icon: Fingerprint, title: "Biometric Lock", desc: "Access your chats with FaceID or Fingerprint." },
                { icon: EyeOff, title: "Incognito Typing", desc: "We don't store your keyboard dictionary or typing habits." },
                { icon: ShieldCheck, title: "Verified Links", desc: "Automatic protection against phishing and malicious URLs." }
              ].map((layer, i) => (
                <Card key={i} className="glass p-6 border-white/10 text-center">
                  <layer.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h4 className="font-bold mb-2">{layer.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}