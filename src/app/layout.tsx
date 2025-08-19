import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthStatus from "@/components/auth/AuthStatus";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VIORA",
  description: "Global social network MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <div className="grid min-h-screen grid-cols-[240px_1fr] grid-rows-[56px_1fr]">
          <header className="col-span-2 row-start-1 flex items-center justify-between border-b px-4">
            <Link href="/" className="font-semibold">VIORA</Link>
            <nav className="flex items-center gap-3">
              <AuthStatus />
            </nav>
          </header>
          <aside className="row-start-2 border-r p-4 space-y-2">
            <div className="text-xs uppercase text-muted-foreground">Menu</div>
            <nav className="flex flex-col gap-2">
              <Link href="/">Home</Link>
              <Link href="/feed">Feed</Link>
              <Link href="/chat">Chat</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/settings">Settings</Link>
              <Link href="/premium">Premium</Link>
            </nav>
          </aside>
          <main className="row-start-2 p-4">{children}</main>
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
