import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-black font-headline mb-8 text-gradient">Privacy Policy</h1>
        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
            <p>We collect information to provide better services to all our users. We stand by our commitment to never sell your personal data. The types of information we collect include account details, encrypted communication metadata, and technical usage data.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, and to protect HappyChat and our users. We do not use your message content for advertising purposes as all messages are end-to-end encrypted.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
            <p>We work hard to protect HappyChat and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. This includes encryption of our services and multi-factor authentication.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}