"use client";

import { Poppins } from "next/font/google";
import Link from "next/link";
import { type ReactNode, type SubmitEventHandler } from "react";

import { cn } from "@/lib/utils";

import FluxLines from "@/components/FluxLines";
import { Button } from "@/components/ui/button";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

type AuthLayoutProps = {
  title: string;
  switchHref: string;
  switchLabel: string;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  children: ReactNode;
};

export function AuthLayout({
  title,
  switchHref,
  switchLabel,
  onSubmit,
  children,
}: AuthLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4">
      <div className="bg-background h-screen w-full overflow-y-auto lg:col-span-2">
        <form onSubmit={onSubmit} className="flex flex-col gap-8 p-4 lg:p-16">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/">
              <span className={cn("text-2xl font-semibold", poppins.className)}>Drawly</span>
            </Link>
            <Button
              nativeButton={false}
              className="border-none text-base underline"
              variant="ghost"
              size="sm"
              render={<Link href={switchHref}>{switchLabel}</Link>}
            />
          </div>
          <h1 className="text-4xl font-medium">{title}</h1>
          {children}
        </form>
      </div>
      <div className="relative hidden overflow-hidden bg-[radial-gradient(120%_120%_at_50%_0%,oklch(0.28_0.04_275),oklch(0.13_0_0)_60%)] lg:col-span-2 lg:block">
        <FluxLines
          colors={["#ffffff", "#ffffff", "#ffffff"]}
          glow={2}
          rimWidth={0.2}
          lineWidth={1}
          flowDirection="down"
          mouseInteraction
          clickSwirl
          speed={0.5}
          scale={1.6}
          turbulence={1}
          fluidity={0.1}
          sharpness={2.5}
          shimmer={1.5}
          mouseStrength={1}
          mouseRadius={0.35}
          intro
          lightMode={false}
        />
      </div>
    </div>
  );
}
