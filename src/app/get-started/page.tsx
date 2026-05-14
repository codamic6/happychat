'use client';

import { FloatingBackground } from '@/components/auth/FloatingBackground';
import { AuthSidebar } from '@/components/auth/AuthSidebar';
import { AuthInput } from '@/components/auth/AuthInput';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Mail, Lock, User, AtSign, Phone, ArrowRight, Loader2, Sparkles, UserPlus, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (username.length < 3) {
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus('checking');
      try {
        const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase().trim()));
        const snap = await getDocs(q);
        setUsernameStatus(snap.empty ? 'available' : 'taken');
      } catch (e) {
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, db]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === 'taken') {
      toast({ variant: "destructive", title: "Username Error", description: "This handle is already taken." });
      return;
    }
    
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        fullName,
        username: username.toLowerCase().trim(),
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isOnline: true,
        showOnlineStatus: true,
      });

      toast({
        title: "Welcome!",
        description: "Your account has been created."
      });
      router.push('/chat');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: err.message || "Could not create your account."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden bg-[#050505]">
      <FloatingBackground />
      <AuthSidebar />

      <div className="flex items-center justify-center p-4 sm:p-8 relative z-10 w-full overflow-y-auto custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl mx-auto py-12"
        >
          <div className="lg:hidden flex flex-col items-center mb-10 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center glow-green-bright shadow-2xl">
              <Zap className="text-primary-foreground h-8 w-8 fill-current" />
            </div>
          </div>

          <div className="glass p-6 sm:p-12 rounded-[3rem] border border-white/5 space-y-10 relative overflow-hidden shadow-2xl max-w-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse" />
            
            <div className="text-center space-y-3 relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-2"
              >
                <ShieldCheck className="w-3 h-3" /> Secure Signup
              </motion.div>
              <h2 className="text-4xl font-bold font-headline text-white tracking-tight uppercase">Join Now</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Create your simple email-based account.</p>
            </div>

            <form onSubmit={handleRegister} className="grid sm:grid-cols-2 gap-6 relative z-10">
              <div className="sm:col-span-2">
                <AuthInput
                  label="Full Name"
                  icon={User}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              
              <div className="relative">
                <AuthInput
                  label="Username"
                  icon={AtSign}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. user_01"
                  required
                  error={usernameStatus === 'taken' ? "Taken" : undefined}
                />
                <div className="absolute right-4 top-7 -translate-y-1/2 z-30 flex items-center">
                  {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  {usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  {usernameStatus === 'taken' && <AlertCircle className="w-4 h-4 text-destructive" />}
                </div>
              </div>

              <AuthInput
                label="Phone (Optional)"
                icon={Phone}
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 000 000"
              />

              <div className="sm:col-span-2">
                <AuthInput
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <AuthInput
                  label="Secure Password"
                  icon={Lock}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-4 pt-6">
                <Button 
                  type="submit" 
                  disabled={isLoading || usernameStatus === 'checking' || usernameStatus === 'taken'}
                  className="w-full h-16 rounded-[1.5rem] bg-primary hover:glow-green-bright transition-all duration-500 font-black uppercase tracking-[0.2em] text-xs shadow-xl group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Create Account
                      <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </span>
                  )}
                </Button>
                
                <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest pt-4">
                  Already have an account? {' '}
                  <Link href="/login" className="text-primary hover:underline ml-1">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}