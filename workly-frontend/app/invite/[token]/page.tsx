"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useAcceptInvite, useDeclineInvite } from "@/hooks/use-queries";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invite/${token}`);
    }
  }, [authLoading, isAuthenticated, router, token]);

  const handleAccept = async () => {
    try {
      setError(null);
      await acceptInvite.mutateAsync(token);
      router.push("/app/orgs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    }
  };

  const handleDecline = async () => {
    try {
      setError(null);
      await declineInvite.mutateAsync(token);
      router.push("/app/orgs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline invite");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="mx-auto h-12 w-12 rounded-full" />
            <Skeleton className="mx-auto mt-4 h-6 w-48" />
            <Skeleton className="mx-auto mt-2 h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-4">You&apos;ve been invited</CardTitle>
          <CardDescription>
            You have been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Accept this invitation to join the organization and start collaborating.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
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
        </CardFooter>
      </Card>
    </div>
  );
}
