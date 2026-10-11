import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import { SITE_URL } from '@/lib/site';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'OpenFolks',
    template: '%s · OpenFolks',
  },
  description: 'A free, open-source desktop app for working with a team of AI agents.',
  openGraph: {
    title: 'OpenFolks',
    description: 'A free, open-source desktop app for working with a team of AI agents.',
    type: 'website',
  },
  icons: {
    icon: '/openfolk.png',
    apple: '/openfolk.png',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
