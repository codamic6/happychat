import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { AiAssistantPreview } from '@/components/AiAssistantPreview';
import { SecurityFocus } from '@/components/SecurityFocus';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] selection:bg-primary/30">
      <Navbar />
      <Hero />
      <Features />
      <SecurityFocus />
      <AiAssistantPreview />
      <Footer />
    </main>
  );
}