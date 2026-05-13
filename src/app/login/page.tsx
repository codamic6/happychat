'use client';

import { FloatingBackground } from '@/components/auth/FloatingBackground';
import { AuthSidebar } from '@/components/auth/AuthSidebar';
import { AuthInput } from '@/components/auth/AuthInput';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Mail, Lock, Chrome, Github, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/chat');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid credentials or protocol mismatch."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    setIsLoading(true);
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/chat');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Protocol handshake failed with provider."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden bg-[#050505]">
      <FloatingBackground />
      <AuthSidebar />

      <div className="flex items-center justify-center p-4 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Mobile Branding */}
          <div className="lg:hidden flex flex-col items-center mb-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center glow-green-bright shadow-2xl">
              <Zap className="text-primary-foreground h-10 w-10 fill-current" />
            </div>
            <h1 className="text-2xl font-black font-headline text-white uppercase tracking-tighter">HappyChat 2026</h1>
          </div>

          <div className="glass p-8 sm:p-14 rounded-[3rem] border border-white/5 space-y-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="text-center space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                <ShieldCheck className="w-3 h-3" /> Secure Handshake
              </div>
              <h2 className="text-4xl font-black font-headline text-white tracking-tight uppercase">Login</h2>
              <p className="text-sm text-muted-foreground font-medium">Verify your identity to enter the nexus.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <AuthInput
                label="Email Address"
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <div className="space-y-3">
                <AuthInput
                  label="Password"
                  icon={Lock}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <div className="flex justify-end pr-2">
                  <Link href="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                    Reset Protocol
                  </Link>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-16 rounded-2xl bg-primary hover:glow-green-bright transition-all duration-500 font-black uppercase tracking-[0.2em] text-xs shadow-xl group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="relative z-10 flex items-center justify-center">
                    Enter Nexus
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative py-4 z-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em]">
                <span className="bg-[#0b0b0b] px-6 text-muted-foreground">Gateway Provider</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <Button 
                onClick={() => handleSocialLogin('google')}
                variant="outline" 
                className="h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-xs"
              >
                <Chrome className="w-4 h-4 mr-2 text-primary" />
                Google
              </Button>
              <Button 
                onClick={() => handleSocialLogin('github')}
                variant="outline" 
                className="h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-xs"
              >
                <Github className="w-4 h-4 mr-2 text-primary" />
                GitHub
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground relative z-10">
              New to the nexus? {' '}
              <Link href="/get-started" className="text-primary font-black uppercase tracking-widest hover:underline transition-all ml-1">
                Register Shard
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
