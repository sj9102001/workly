"use client";

import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotifications, useMarkAllNotificationsRead } from "@/hooks/use-queries";
import { useAuth } from "@/lib/auth";

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { data, isLoading, isError } = useNotifications(open && isAuthenticated, 0, 5, false);
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleMarkAllRead = async () => {
    await markAllReadMutation.mutateAsync();
  };

  const notifications = data?.content ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              You&apos;ll see the latest updates related to your account here.
            </p>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto rounded-md border bg-muted/30">
            {isLoading && (
              <div className="p-4 text-sm text-muted-foreground">Loading notifications...</div>
            )}
            {isError && !isLoading && (
              <div className="p-4 text-sm text-destructive">
                Failed to load notifications. Please try again.
              </div>
            )}
            {!isLoading && !isError && notifications.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
            )}
            {!isLoading && !isError &&
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (n.type === "INVITE_RECEIVED" && n.actionPayload) {
                      try {
                        const payload = JSON.parse(n.actionPayload) as {
                          inviteToken?: string;
                          acceptUrl?: string;
                        };
                        const target =
                          payload?.acceptUrl ||
                          (payload?.inviteToken ? `/invite/${payload.inviteToken}` : null);
                        if (target) {
                          onOpenChange(false);
                          router.push(target);
                        }
                      } catch {
                        // silently ignore if payload is malformed
                      }
                    }
                  }}
                  className="flex w-full items-start gap-3 border-b last:border-b-0 px-4 py-3 text-left text-sm hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/80 transition-colors"
                >
                  <div className="mt-0.5">
                    <span
                      className={
                        n.read
                          ? "h-2 w-2 rounded-full bg-muted-foreground/40 inline-block"
                          : "h-2 w-2 rounded-full bg-primary inline-block"
                      }
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize text-xs text-muted-foreground">
                        {n.type.toLowerCase().replace(/_/g, " ")}
                      </span>
                      {!n.read && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm leading-snug">
                      {n.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(n.createdAt), "MMM d, yyyy · h:mm a")}{" "}
                      <span className="ml-1 text-[11px] text-muted-foreground/80">
                        ({formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })})
                      </span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

