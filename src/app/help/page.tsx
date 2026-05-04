import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function HelpPage() {
  const faqs = [
    {
      q: "Is HappyChat really secure?",
      a: "Yes! Every message sent on HappyChat is protected by end-to-end encryption. This means only you and the recipient can read what is sent."
    },
    {
      q: "How does the AI Assistant work?",
      a: "Our AI Assistant runs on secure models that respect your privacy. It can summarize long threads, suggest quick replies, and help you find information across your history."
    },
    {
      q: "Can I use HappyChat on multiple devices?",
      a: "Absolutely. HappyChat syncs seamlessly across your phone, tablet, and desktop, maintaining your security state on all platforms."
    },
    {
      q: "What happens if I lose my account access?",
      a: "We provide secure recovery keys during setup. Keep these safe, as our end-to-end encryption means we cannot reset your password without them."
    }
  ];

  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-black font-headline mb-12 text-gradient">Help Center</h1>
        <div className="glass p-8 rounded-2xl border border-white/10 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-white hover:text-primary">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Still need help? Reach out to our support team at <span className="text-primary">support@happychat.io</span></p>
        </div>
      </div>
      <Footer />
    </main>
  );
}