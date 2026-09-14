import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.openfolks.com'),
  title: {
    default: 'OpenFolks Docs',
    template: '%s · OpenFolks Docs',
  },
  description: 'Install, configure, and extend your local-first team of AI agents.',
  openGraph: {
    title: 'OpenFolks Docs',
    description: 'Your own team of AI agents, in a chat app.',
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
