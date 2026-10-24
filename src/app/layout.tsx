import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contract Change Assistant",
  description: "Guidance for metering point changes in energy sales contracts (demo prototype).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="et">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
