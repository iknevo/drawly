"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, GlobeIcon, LockIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

import { useTRPC } from "@/trpc/client";

type ShareMenuProps = {
  boardId: string;
  isPublic: boolean;
};

export function ShareMenu({ boardId, isPublic }: ShareMenuProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );

  const boardKey = trpc.boards.get.queryKey({ id: boardId });

  const setPublic = useMutation(
    trpc.boards.setPublic.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: boardKey });
        const previous = queryClient.getQueryData(boardKey);
        queryClient.setQueryData(boardKey, (current) =>
          current ? { ...current, isPublic: variables.isPublic } : current
        );
        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(boardKey, context.previous);
        }
        toast.add({ type: "error", description: error.message });
      },
      onSuccess: (_data, variables) => {
        toast.add({
          type: "success",
          description: variables.isPublic ? "Board is now public" : "Board is now private",
        });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: boardKey });
      },
    })
  );

  const url = `${origin}/boards/share/${boardId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.add({ type: "success", description: "Link copied to clipboard" });
    } catch {
      toast.add({ type: "error", description: "Couldn't copy the link" });
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={isPublic ? "Share board (public)" : "Share board (private)"}
          />
        }
      >
        {isPublic ? <GlobeIcon /> : <LockIcon />}
        Share
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Share this board</PopoverTitle>
          <PopoverDescription>
            {isPublic
              ? "Anyone with the link can view this board."
              : "Only you can open this board."}
          </PopoverDescription>
        </PopoverHeader>

        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <Label htmlFor="board-public" className="flex items-center gap-2.5">
            {isPublic ? (
              <GlobeIcon className="text-muted-foreground size-4" />
            ) : (
              <LockIcon className="text-muted-foreground size-4" />
            )}
            {isPublic ? "Public" : "Private"}
          </Label>
          <Switch
            id="board-public"
            checked={isPublic}
            disabled={setPublic.isPending}
            onCheckedChange={(next) => setPublic.mutate({ id: boardId, isPublic: next })}
          />
        </div>

        {isPublic && (
          <div className="flex items-center gap-2">
            <Input readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
            <Button variant="outline" size="icon-sm" aria-label="Copy link" onClick={copyLink}>
              <CopyIcon />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
