import type { Metadata } from "next";
import "./globals.css";
import { cabinetGrotesk, satoshi } from "@/lib/fonts";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastOverlay } from "@/components/ui/ToastOverlay";

export const metadata: Metadata = {
  title: "Gorave Admin",
  description: "Gorave internal admin panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cabinetGrotesk.variable} ${satoshi.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink-primary">
        <QueryProvider>
          {children}
          <ToastOverlay />
        </QueryProvider>
      </body>
    </html>
  );
}
