import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/context';
import { AuthProvider } from '@/lib/auth/context';

export const metadata: Metadata = {
  title: 'MAHER STOCK | Complexe Maher – Restaurant et Piscine',
  description: 'Application professionnelle de gestion de l\'économat et contrôle anti-vol des stocks pour Complexe Maher',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/icons/icon-512.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Maher Stock',
  },
};

export const viewport: Viewport = {
  themeColor: '#151936',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
