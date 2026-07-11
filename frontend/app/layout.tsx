import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpsShield",
  description: "Internal operations platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex gap-6">
            <Link href="/" className="hover:text-gray-300">Home</Link>
            <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
            <Link href="/tasks" className="hover:text-gray-300">Tasks</Link>
          </div>
        </nav>
        <main className="container mx-auto p-4 flex-1">{children}</main>
      </body>
    </html>
  );
}
