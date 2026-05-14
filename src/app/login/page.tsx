'use client';

import { FloatingBackground } from '@/components/auth/FloatingBackground';
import { AuthSidebar } from '@/components/auth/AuthSidebar';
import { AuthInput } from '@/components/auth/AuthInput';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
        description: "Invalid email or password."
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile Branding */}
          <div className="lg:hidden flex flex-col items-center mb-10 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center glow-green-bright shadow-2xl">
              <Zap className="text-primary-foreground h-8 w-8 fill-current" />
            </div>
            <h1 className="text-xl font-bold font-headline text-white uppercase tracking-tighter">HappyChat</h1>
          </div>

          <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-white/5 space-y-8 relative overflow-hidden shadow-2xl group">
            {/* Energy Core Pulse */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse" />
            
            <div className="text-center space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                <ShieldCheck className="w-3 h-3" /> Secure Login
              </div>
              <h2 className="text-4xl font-bold font-headline text-white tracking-tight uppercase">Login</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Sign in to your account.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div className="space-y-4">
                <AuthInput
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@email.com"
                  required
                />
                <div className="space-y-2">
                  <AuthInput
                    label="Password"
                    icon={Lock}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <div className="flex justify-end px-2">
                    <Link href="/forgot-password" size="sm" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
                      Forgot Password?
                    </Link>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-16 rounded-2xl bg-primary hover:glow-green-bright transition-all duration-500 font-black uppercase tracking-[0.2em] text-xs shadow-xl group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="pt-6 text-center space-y-4 relative z-10">
              <div className="flex items-center gap-2 justify-center opacity-30">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Private Chat Active</span>
              </div>
              
              <p className="text-xs text-muted-foreground font-medium">
                New here? {' '}
                <Link href="/get-started" className="text-primary font-black uppercase tracking-widest hover:underline transition-all ml-1">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center opacity-20 hover:opacity-50 transition-opacity">
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white">Version: 1.0.0 Stable</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
