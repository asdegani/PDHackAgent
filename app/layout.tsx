import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaBootstrap } from "@/components/pwa-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guided Movement Session",
  description: "Privacy-first guided movement and conversation PWA",
};

export const viewport: Viewport = {
  themeColor: "#16324f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaBootstrap />
        {children}
      </body>
    </html>
  );
}
