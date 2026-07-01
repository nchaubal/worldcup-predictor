import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/context/TournamentContext";
import Navbar from "@/components/Navbar";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "World Cup Predictor 2026",
  description: "Predict matches, compete with friends, and follow the FIFA World Cup 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TournamentProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </TournamentProvider>
      </body>
    </html>
  );
}
