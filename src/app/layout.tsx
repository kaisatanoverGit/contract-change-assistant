import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contract Change Assistant",
  description: "Guidance for metering point changes in energy sales contracts (demo prototype).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="et">
      <body className="flex min-h-screen flex-col font-sans">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
          © 2026 Demo Energy Ltd. Built with Claude Code
        </footer>
      </body>
    </html>
  );
}
