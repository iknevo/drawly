"use client";

import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useSound } from "@/components/sound-provider";
import { Button } from "@/components/ui/button";

export function SoundToggle() {
  const { muted, toggleMuted } = useSound();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isMounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      onClick={toggleMuted}
    >
      {muted ? <VolumeXIcon /> : <Volume2Icon />}
    </Button>
  );
}
