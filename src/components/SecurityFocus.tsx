import { Shield, Lock, EyeOff, Key } from 'lucide-react';

export function SecurityFocus() {
  return (
    <section id="security" className="py-24 bg-[#050505] border-y border-white/5">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8 mb-16">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 glow-green animate-pulse">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tight">Your Privacy is <br /><span className="text-primary">Non-Negotiable</span></h2>
          <p className="text-muted-foreground text-lg">
            We've built HappyChat with a zero-trust architecture. Your messages are your business, and we make sure it stays that way.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Encrypted End-to-End</h3>
            <p className="text-sm text-muted-foreground">Only you and the person you're communicating with can read or listen to what is sent.</p>
          </div>
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6">
              <EyeOff className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Protected Data</h3>
            <p className="text-sm text-muted-foreground">We never sell your data or use it for targeted advertising. Your privacy comes first.</p>
          </div>
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Secure Authentication</h3>
            <p className="text-sm text-muted-foreground">Multi-factor authentication and biometric locks ensure only you have access to your account.</p>
          </div>
        </div>
      </div>
    </section>
  );
}