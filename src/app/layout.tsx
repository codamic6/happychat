import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'HappyChat | Simple Email-Based Messaging',
  description: 'The world\'s simplest email-based messaging app. Secure, private, and accessible to everyone with an email address.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/mob.png',
  },
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
        <link rel="apple-touch-icon" href="/mob.png" />
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
