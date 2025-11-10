import type { Metadata } from "next";
import { Oswald, Quattrocento_Sans } from 'next/font/google';
import "./globals.css";

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const quattrocentoSans = Quattrocento_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Vanguard League - VGI Trench at VanGuard Gym",
  description: "Submission-only ladder league competition at VanGuard Gym",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${oswald.variable} ${quattrocentoSans.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
