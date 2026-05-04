
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="glow-orb top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="glass p-12 md:p-20 rounded-[3rem] border border-white/10 space-y-8 max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter uppercase italic">Ready to join the <br /><span className="text-primary">HappyChat</span> revolution?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            The smartest, most secure way to stay connected is just a click away.
            Start chatting for free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started">
              <Button size="lg" className="h-16 px-10 text-xl font-black uppercase tracking-widest glow-green">Get Started Now</Button>
            </Link>
            <Link href="/help">
              <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-black uppercase tracking-widest">Learn More</Button>
            </Link>
          </div>
        </div>
        
        <footer className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center glow-green">
              <Zap className="text-primary-foreground h-3 w-3 fill-current" />
            </div>
            <span className="font-headline font-black text-white italic">HappyChat</span>
          </Link>
          
          <div className="flex items-center gap-8">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
            <Link href="/api-portal" className="hover:text-white transition-colors">API</Link>
          </div>
          
          <p>© 2024 HappyChat Inc. All rights reserved.</p>
        </footer>
      </div>
    </section>
  );
}
