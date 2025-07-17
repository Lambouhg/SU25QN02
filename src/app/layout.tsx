import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserSync from "@/components/UserSync";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { UserSyncProvider } from "@/context/UserSyncContext";
import { RoleProvider } from "@/context/RoleContext";
import AdminRedirect from "@/components/auth/AdminRedirect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Interview",
  description: "Improve your interview skills with our AI-powered platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <UserSyncProvider>
        <RoleProvider>
          <html lang="en" className="h-full">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full m-0 p-0`}>
              {children}
              <UserSync />
              <AuthRedirect />
              <AdminRedirect />
            </body>
          </html>
        </RoleProvider>
      </UserSyncProvider>
    </ClerkProvider>
  );
}
