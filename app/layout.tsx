import type { Metadata, Viewport } from 'next';
import './globals.css';

const TITLE = 'AFASA Scam-Safe Assistant';
const DESCRIPTION =
  'Ask questions about the Philippine Anti-Financial Account Scamming Act (RA 12010) and BSP Circulars 1213, 1214 and 1215, with page citations.';

export const metadata: Metadata = {
  metadataBase: new URL('https://afasa-rag-bot.vercel.app'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    siteName: TITLE,
    locale: 'en_PH',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}