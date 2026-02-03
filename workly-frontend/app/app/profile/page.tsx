"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, CheckCircle2, XCircle, User as UserIcon } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { PageSkeleton } from "@/components/app-shell/skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUser, usePendingInvites } from "@/hooks/use-queries";
import { useAuth } from "@/lib/auth";
import { AcceptInviteModal } from "@/components/app-shell/accept-invite-modal";
import { format } from "date-fns";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: pendingInvites, isLoading: invitesLoading } = usePendingInvites();
  const [acceptInviteModalOpen, setAcceptInviteModalOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<{
    token: string;
    organizationName?: string;
    invitedRole?: string;
    expiresAt?: string;
  } | null>(null);

  const isLoading = userLoading || invitesLoading;

  const handleInviteClick = (invite: {
    token: string;
    organizationName?: string;
    invitedRole?: string;
    expiresAt?: string;
  }) => {
    setSelectedInvite(invite);
    setAcceptInviteModalOpen(true);
  };

  if (isLoading) {
    return (
      <>
        <AppTopbar breadcrumbs={[{ label: "Profile" }]} />
        <main className="flex-1 overflow-auto p-6">
          <PageSkeleton />
        </main>
      </>
    );
  }

  return (
    <>
      <AppTopbar breadcrumbs={[{ label: "Profile" }]} />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{user?.name || "User"}</CardTitle>
                  <CardDescription className="mt-1">{user?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span>{user?.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Pending Invitations</CardTitle>
              </div>
              <CardDescription>
                You have {pendingInvites?.length || 0} pending invitation{pendingInvites?.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvites && pendingInvites.length > 0 ? (
                <div className="space-y-3">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {invite.organizationName || `Organization ${invite.orgId}`}
                            </p>
                            <Badge variant="outline">{invite.invitedRole}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Expires {format(new Date(invite.expiresAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInviteClick({
                            token: invite.token,
                            organizationName: invite.organizationName,
                            invitedRole: invite.invitedRole,
                            expiresAt: format(new Date(invite.expiresAt), "MMM d, yyyy h:mm a"),
                          })}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">No pending invitations</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You&apos;ll see invitations here when someone invites you to join an organization.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {selectedInvite && (
        <AcceptInviteModal
          open={acceptInviteModalOpen}
          onOpenChange={setAcceptInviteModalOpen}
          inviteToken={selectedInvite.token}
          organizationName={selectedInvite.organizationName}
          invitedRole={selectedInvite.invitedRole}
          expiresAt={selectedInvite.expiresAt}
        />
      )}
    </>
  );
}
