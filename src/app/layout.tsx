import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TournamentContextSwitcher } from "@/context/TournamentContextSwitcher";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Patrons Cup Live - Golf Tournament",
  description: "Live scoring and tournament management for the Patrons Cup golf tournament",
  icons: {
    icon: '/patrons-cup-logo.png',
    shortcut: '/patrons-cup-logo.png',
    apple: '/patrons-cup-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TournamentContextSwitcher useSupabase={false}>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            </div>
          </TournamentContextSwitcher>
        </AuthProvider>
      </body>
    </html>
  );
}
