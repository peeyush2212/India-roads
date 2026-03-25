import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PaywallModal } from "@/components/paywall-modal";

export const metadata: Metadata = {
  title: "India‑ROADS — India emissions simulator",
  description: "En‑ROADS‑style India-tailored emissions simulator with interactive sliders and charts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-dvh">
            <SiteHeader />
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
            <SiteFooter />
            <PaywallModal />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
