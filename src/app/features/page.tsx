import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Features } from '@/components/Features';
import { Shield, Smartphone, Globe, Cloud } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="pt-32">
        <div className="container mx-auto px-6 mb-20 text-center">
          <h1 className="text-5xl md:text-7xl font-black font-headline mb-6 text-gradient">Built for Speed. <br />Designed for You.</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Explore the deep capabilities of the most advanced messaging platform ever created.</p>
        </div>
        <Features />
        
        <section className="py-24 bg-[#050505]">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl font-black font-headline">Seamless Connectivity</h2>
                <div className="grid gap-6">
                  {[
                    { icon: Globe, title: "Global Network", text: "Optimized routing for low-latency calls anywhere in the world." },
                    { icon: Cloud, title: "Intelligent Sync", text: "Instant history sync with zero battery drain optimization." },
                    { icon: Smartphone, title: "Native Experience", text: "Pixel-perfect performance on iOS, Android, and Web." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <item.icon className="text-primary w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass aspect-square rounded-[3rem] border border-white/10 flex items-center justify-center">
                 <Shield className="w-32 h-32 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}