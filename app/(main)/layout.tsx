"use client"; // Required to use usePathname()

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "../globals.css"; // Fixed path: since this is inside (main), globals.css is usually up one level in /app
import SideBar from "@/component/sideNavbar"; // Make sure your folder is 'components' or adjust to 'component'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoginPage && localStorage.getItem("isLoggedIn") !== "true") {
      router.push("/");
    }
  }, [isLoginPage, router]);

  if (!mounted) {
    return null; // Or a loading spinner
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {isLoginPage ? (
          // Login Layout: Pure full screen, NO Sidebar
          <main>{children}</main>
        ) : (
          // Main App Layout: Flex container rendering Sidebar next to the content
          <div className="flex min-h-screen">
            <SideBar />
            <main className="flex-1">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}