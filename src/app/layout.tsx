import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'HappyChat | World\'s 1st Email-Based Messenger',
  description: 'The world\'s 1st email-based chat app. Secure, private, and accessible to everyone with an email address. Join the 2026 Signal Mesh.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HappyChat',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/hc/180/180" />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
        <FirebaseClientProvider { ...{}}>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
