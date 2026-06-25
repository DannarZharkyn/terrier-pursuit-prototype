import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Terrier Pursuit Prototype",
  description: "Frontend-only prototype for Terrier Pursuit.",
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
