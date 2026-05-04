import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-black font-headline mb-8 text-gradient">Terms of Service</h1>
        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using HappyChat, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p>Permission is granted to temporarily download one copy of the materials (information or software) on HappyChat's website for personal, non-commercial transitory viewing only.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Disclaimer</h2>
            <p>The materials on HappyChat's website are provided on an 'as is' basis. HappyChat makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Limitations</h2>
            <p>In no event shall HappyChat or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on HappyChat's website.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}