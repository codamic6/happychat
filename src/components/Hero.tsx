
import { Button } from '@/components/ui/button';
import { MessageSquare, Shield, Phone, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

export function Hero() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-chat');

  return (
    <section className="relative pt-32 pb-20 overflow-hidden mesh-gradient min-h-screen flex items-center">
      <div className="glow-orb top-[-10%] left-[-5%]" />
      <div className="glow-orb bottom-[-10%] right-[-5%] opacity-50" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3 h-3" /> AI-Powered Communication
            </div>
            
            <h1 className="font-headline text-6xl md:text-8xl font-black leading-tight tracking-tighter text-gradient">
              Secure Chat. <br />
              <span className="text-primary">Evolved.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Experience the next generation of messaging with real-time AI assistance, 
              end-to-end security, and crystal-clear communication across all your devices.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/get-started">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold glow-green hover:glow-green-bright transition-all">
                  Get Started
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-white/10 hover:bg-white/5 transition-all">
                Live Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${i + 10}/100/100`} 
                      alt="User" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Joined by <span className="text-white font-bold">10k+</span> creators worldwide
              </p>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-emerald-500/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-card shadow-2xl animate-float">
              {heroImage && (
                <Image 
                  src={heroImage.imageUrl} 
                  alt={heroImage.description}
                  width={1200}
                  height={800}
                  className="w-full h-auto opacity-80"
                  data-ai-hint={heroImage.imageHint}
                />
              )}
              {/* Floating UI Elements */}
              <div className="absolute top-8 right-8 p-4 glass rounded-xl border border-white/10 animate-pulse delay-75">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Incoming Call</div>
                    <div className="text-[10px] text-emerald-400">Secure Line</div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-12 left-8 p-4 glass rounded-xl border border-white/10 animate-pulse delay-500">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <div className="text-xs font-bold text-white italic">AI Suggestion: "Sounds perfect!"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
