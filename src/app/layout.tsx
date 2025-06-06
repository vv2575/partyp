// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Or your chosen fonts
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar'; // Ensure this import is correct

// Font setup (example)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Political Platform App", // Or your app's title
  description: "A platform for political discussion and organization.", // Or your app's description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <header className="sticky-header">
            <Navbar />
          </header>
          <main className="pt-16 md:pt-20">{/* Add padding-top to main to offset sticky header height */}
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}