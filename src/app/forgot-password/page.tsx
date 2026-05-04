
'use client';

import { FloatingBackground } from '@/components/auth/FloatingBackground';
import { AuthSidebar } from '@/components/auth/AuthSidebar';
import { AuthInput } from '@/components/auth/AuthInput';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const auth = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast({
        title: "Transmission Sent",
        description: "Recovery instructions dispatched to your communication node."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Transmission Failed",
        description: "Could not locate node in the network."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden bg-[#050505]">
      <FloatingBackground />
      <AuthSidebar />

      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-white/5 space-y-8 relative overflow-hidden shadow-2xl">
            <div className="text-center space-y-2 relative z-10">
              <h2 className="text-3xl font-black font-headline text-white italic tracking-tight uppercase">Node Recovery</h2>
              <p className="text-sm text-muted-foreground">Restore your access to the secure network.</p>
            </div>

            {!sent ? (
              <form onSubmit={handleReset} className="space-y-6 relative z-10">
                <AuthInput
                  label="Communication Node / Email"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                />

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-14 rounded-xl bg-primary hover:glow-green-bright transition-all duration-500 font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(0,200,83,0.3)] group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Send Recovery Link
                      <Send className="w-4 h-4 ml-2 group-hover:translate-y-[-2px] group-hover:translate-x-[2px] transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6 relative z-10 py-8">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto glow-green">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white uppercase italic">Signal Dispatched</h3>
                  <p className="text-sm text-muted-foreground">Check your node for recovery instructions.</p>
                </div>
              </div>
            )}

            <div className="relative z-10 flex justify-center">
              <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Return to Access Hub
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
