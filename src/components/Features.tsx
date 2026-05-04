import { MessageCircle, Video, FileText, Smartphone, Lock, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const features = [
  {
    title: 'Real-time Messaging',
    description: 'Engage in lightning-fast text conversations with typing indicators, read receipts, and interactive emoji reactions.',
    icon: MessageCircle,
    color: 'text-primary'
  },
  {
    title: 'HD Voice & Video',
    description: 'Experience crystal-clear communication with low-latency audio waves and dynamic video frame previews.',
    icon: Video,
    color: 'text-emerald-400'
  },
  {
    title: 'Smart Media Sharing',
    description: 'Easily share high-res images, videos, and large documents with rich cloud-integrated preview cards.',
    icon: FileText,
    color: 'text-blue-400'
  },
  {
    title: 'Multi-Device Sync',
    description: 'A seamless and optimized experience across mobile, tablet, and desktop with instant message synchronization.',
    icon: Smartphone,
    color: 'text-purple-400'
  },
  {
    title: 'E2E Encryption',
    description: 'Benefit from industry-leading security protocols and protected chats to safeguard every conversation.',
    icon: Lock,
    color: 'text-primary'
  },
  {
    title: 'AI Search & Retrieval',
    description: 'Quickly find specific information from your past conversations using our advanced AI-powered assistant.',
    icon: Search,
    color: 'text-primary'
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#0d0d0d]">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black font-headline">Built for the <span className="text-primary">Future</span></h2>
          <p className="text-muted-foreground text-lg">
            Powerful features designed to make your communication faster, smarter, and more secure than ever before.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Card key={idx} className="bg-[#161616] border-white/5 hover:border-primary/50 hover:glow-green transition-all duration-500 group">
              <CardHeader className="p-8">
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-2xl font-bold mb-4">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}