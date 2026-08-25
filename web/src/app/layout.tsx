import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Voting Admin Dashboard",
  description: "Dashboard premium untuk KPU Mahasiswa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable} antialiased`}>
      <body className="bg-white">
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
