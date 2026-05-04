import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, Shield, Zap } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-green">
          <MessageSquare className="text-primary-foreground h-5 w-5" />
        </div>
        <span className="font-headline font-bold text-xl tracking-tight">HappyChat</span>
      </div>
      
      <div className="hidden md:flex items-center gap-8">
        <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Features</Link>
        <Link href="#security" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Security</Link>
        <Link href="#ai" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">AI Assistant</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors px-4">Login</Link>
        <Button className="glow-green hover:glow-green-bright transition-all duration-300">Get Started</Button>
      </div>
    </nav>
  );
}