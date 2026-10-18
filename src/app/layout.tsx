import "@quickdrawjs/core/quickdraw.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Geist_Mono, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { cn } from "@/lib/utils";

import { SoundProvider } from "@/components/sound-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
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
                  <PWAInstallPrompt />
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
