"use client"; // Required to use usePathname()

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {isLoginPage ? (
          // Login Layout (No Sidebar)
          <main>{children}</main>
        ) : (
          // Main App Layout (With Sidebar)
          <div className="flex min-h-screen">

            <main className="flex-1">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}