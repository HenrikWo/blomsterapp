import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BlomsterApp - Lær norske blomster',
  description: 'En interaktiv app for å lære seg norske blomsterarter med bilder fra Wikipedia',
  keywords: ['blomster', 'planter', 'norsk', 'natur', 'læring'],
  authors: [{ name: 'Henrik' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}