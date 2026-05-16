import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { SecurityFocus } from '@/components/SecurityFocus';
import { Footer } from '@/components/Footer';
import { ScrollProgress } from '@/components/ScrollProgress';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] selection:bg-primary/30 relative overflow-x-hidden">
      <ScrollProgress />

      {/* Global Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        <Navbar />
        
        <section className="relative">
          <Hero />
        </section>

        <section className="relative bg-[#080808]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] pointer-events-none" />
          <Features />
        </section>

        <section className="relative py-32 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,200,83,0.05)_0%,transparent_70%)]" />
          <SecurityFocus />
        </section>

        <section className="relative pt-20">
          <Footer />
        </section>
      </div>
    </main>
  );
}
