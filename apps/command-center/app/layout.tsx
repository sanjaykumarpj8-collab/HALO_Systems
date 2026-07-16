import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HALO — Stadium Operations Command Center",
  description: "AI-powered multi-agent stadium operations management system. Real-time incident tracking, staff dispatch, and crowd analytics.",
  keywords: "stadium, operations, AI, incident management, staff dispatch, HALO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
