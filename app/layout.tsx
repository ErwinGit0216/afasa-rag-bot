import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AFASA Scam-Safe Assistant',
  description:
    'Ask questions about the Philippine Anti-Financial Account Scamming Act (RA 12010) and BSP Circulars 1213, 1214 and 1215, with page citations.',
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
