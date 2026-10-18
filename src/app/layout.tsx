import "@quickdrawjs/core/quickdraw.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { cn } from "@/lib/utils";

import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { SoundProvider } from "@/components/sound-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";
import { env } from "@/env";
import { TRPCReactProvider } from "@/trpc/client";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: { default: "Drawly", template: "%s | Drawly" },
  description: "Sketch, write, and plan - draw your ideas.",
  applicationName: "Drawly",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico", apple: "/icons/icon-192.png" },
  openGraph: {
    type: "website",
    siteName: "Drawly",
    title: "Drawly",
    description: "Sketch, write, and plan - draw your ideas.",
    url: env.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: "summary",
    title: "Drawly",
    description: "Sketch, write, and plan - draw your ideas.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <NuqsAdapter>
          <TRPCReactProvider>
            <ThemeProvider>
              <SoundProvider>
                <TooltipProvider>
                  {children}
                  <Toaster />
                  <ReactQueryDevtools initialIsOpen={false} />
                </TooltipProvider>
              </SoundProvider>
            </ThemeProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
