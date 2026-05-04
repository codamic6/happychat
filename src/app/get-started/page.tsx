
'use client';

import { FloatingBackground } from '@/components/auth/FloatingBackground';
import { AuthSidebar } from '@/components/auth/AuthSidebar';
import { AuthInput } from '@/components/auth/AuthInput';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Mail, Lock, User, AtSign, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        profileImageUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Identity Created",
        description: "Welcome to the next generation of communication."
      });
      router.push('/');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: err.message || "Failed to create identity."
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
          className="w-full max-w-lg"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center glow-green-bright">
              <Zap className="text-primary-foreground h-10 w-10 fill-current" />
            </div>
          </div>

          <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden shadow-2xl">
            <div className="text-center space-y-2 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <Sparkles className="w-3 h-3" /> New Identity protocol
              </motion.div>
              <h2 className="text-3xl font-black font-headline text-white italic tracking-tight uppercase">Forge Account</h2>
              <p className="text-sm text-muted-foreground">Join the elite network of HappyChat creators.</p>
            </div>

            <form onSubmit={handleRegister} className="grid sm:grid-cols-2 gap-4 relative z-10">
              <div className="sm:col-span-2">
                <AuthInput
                  label="Full Legal Name"
                  icon={User}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <AuthInput
                label="Public Handle"
                icon={AtSign}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe_99"
                required
              />
              <AuthInput
                label="Communication Node"
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@node.com"
                required
              />
              <div className="sm:col-span-2">
                <AuthInput
                  label="Security Matrix / Password"
                  icon={Lock}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-4 pt-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    By initializing this identity, you agree to the <span className="text-white font-bold">Protocol Terms</span> and <span className="text-white font-bold">Privacy Matrix</span>.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-14 rounded-xl bg-primary hover:glow-green-bright transition-all duration-500 font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(0,200,83,0.3)] group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Begin Initialization
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <p className="text-center text-xs text-muted-foreground relative z-10">
              Already registered in the system? {' '}
              <Link href="/login" className="text-primary font-black uppercase tracking-widest hover:underline transition-all">
                Access Hub
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
