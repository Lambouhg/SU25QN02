import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserSync from "@/components/UserSync";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { UserSyncProvider } from "@/context/UserSyncContext";
import { RoleProvider } from "@/context/RoleContext";
import { GlobalChatboxProvider } from "@/context/GlobalChatboxContext";
import GlobalChatboxContainer from "@/components/ui/chatbox/GlobalChatboxContainer";
import UserSyncAuth from "@/components/auth/UserSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F.AI Interview",
  description: "Improve your interview skills with our AI-powered platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <UserSyncAuth>
        <UserSyncProvider>
          <RoleProvider>
            <GlobalChatboxProvider>
              <html lang="en" className="h-full">
                <body 
                  className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full m-0 p-0`}
                  suppressHydrationWarning={true}
                >
                  {children}
                  <UserSync />
                  <AuthRedirect />
                  <GlobalChatboxContainer />
                </body>
              </html>
            </GlobalChatboxProvider>
          </RoleProvider>
        </UserSyncProvider>
      </UserSyncAuth>
    </ClerkProvider>
  );
}
