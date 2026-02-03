"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAcceptInvite, useDeclineInvite } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";

interface AcceptInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteToken: string;
  organizationName?: string;
  invitedRole?: string;
  expiresAt?: string;
}

export function AcceptInviteModal({
  open,
  onOpenChange,
  inviteToken,
  organizationName,
  invitedRole,
  expiresAt,
}: AcceptInviteModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  const handleAccept = async () => {
    try {
      setError(null);
      await acceptInvite.mutateAsync(inviteToken);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onOpenChange(false);
      router.push("/app/orgs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    }
  };

  const handleDecline = async () => {
    try {
      setError(null);
      await declineInvite.mutateAsync(inviteToken);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline invite");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="mt-4 text-center">You&apos;ve been invited</DialogTitle>
          <DialogDescription className="text-center">
            {organizationName ? (
              <>
                You have been invited to join <strong>{organizationName}</strong>
              </>
            ) : (
              "You have been invited to join an organization"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            {organizationName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Organization</span>
                <span className="text-sm font-medium">{organizationName}</span>
              </div>
            )}
            {invitedRole && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant="outline">{invitedRole}</Badge>
              </div>
            )}
            {expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className="text-sm">{expiresAt}</span>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Accept this invitation to join the organization and start collaborating.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={handleDecline}
            disabled={declineInvite.isPending || acceptInvite.isPending}
          >
            {declineInvite.isPending ? "Declining..." : "Decline"}
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={acceptInvite.isPending || declineInvite.isPending}
          >
            {acceptInvite.isPending ? (
              "Accepting..."
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Accept Invite
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
