import "@quickdrawjs/core/quickdraw.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Geist_Mono, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";

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
      <body>
        <NuqsAdapter>
          <TRPCReactProvider>
            <ThemeProvider>
              <TooltipProvider>
                <main>{children}</main>
                <Toaster />
                <ReactQueryDevtools initialIsOpen={false} />
              </TooltipProvider>
            </ThemeProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
