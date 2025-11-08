import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Escape Room - Interactive Isometric Puzzle Game',
  description: 'An AI-powered isometric escape room game with voice interaction and puzzle solving',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
