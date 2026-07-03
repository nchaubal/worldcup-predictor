import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";
import { TournamentProviderSupabase } from "@/context/TournamentContextSupabase";
import Navbar from "@/components/Navbar";

const josefinSans = Josefin_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" className={`${josefinSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TournamentProviderSupabase>
          <Navbar />
          <main className="flex-1">{children}</main>
        </TournamentProviderSupabase>
      </body>
    </html>
  );
}
