import { Link2OffIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Board not available",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Link2OffIcon className="size-6" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">This link is no longer available</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          The board you&apos;re looking for is private or no longer exists. Create your own board to
          start drawing.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/boards" className={cn(buttonVariants())}>
          Create your own
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
          Go to Drawly
        </Link>
      </div>
    </div>
  );
}
