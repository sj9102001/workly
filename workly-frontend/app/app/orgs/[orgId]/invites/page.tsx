"use client";

import { use, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, MoreHorizontal, XCircle } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { NoInvites } from "@/components/app-shell/empty-states";
import { TableSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrganization, useInvites, useCreateInvite, useRevokeInvite } from "@/hooks/use-queries";

function InvitesPageContent({ orgId }: { orgId: string }) {
  const orgIdNum = Number(orgId);
  const searchParams = useSearchParams();

  const { data: org } = useOrganization(orgIdNum);
  const { data: invites, isLoading } = useInvites(orgIdNum);
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [revokeConfirmId, setRevokeConfirmId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("MEMBER");

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const handleCreate = async () => {
    if (!email.trim()) return;
    await createInvite.mutateAsync({ orgId: orgIdNum, email, role });
    setIsCreateOpen(false);
    setEmail("");
    setRole("MEMBER");
  };

  const handleRevoke = async () => {
    if (revokeConfirmId) {
      await revokeInvite.mutateAsync({ inviteId: revokeConfirmId, orgId: orgIdNum });
      setRevokeConfirmId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "ACCEPTED":
        return "default";
      case "DECLINED":
      case "REVOKED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const pendingInvites = invites?.filter((i) => i.status === "PENDING") || [];
  const otherInvites = invites?.filter((i) => i.status !== "PENDING") || [];

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Invites" },
        ]}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invites</h1>
            <p className="text-sm text-muted-foreground">Manage invitations to your organization</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Send Invite
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : invites?.length === 0 ? (
          <NoInvites onCreateInvite={() => setIsCreateOpen(true)} />
        ) : (
          <div className="space-y-6">
            {pendingInvites.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">Pending Invites</h2>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingInvites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">{invite.invitedEmail}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{invite.invitedRole}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(invite.expiresAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(invite.status)}>{invite.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setRevokeConfirmId(invite.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Revoke Invite
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {otherInvites.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">Past Invites</h2>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherInvites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">{invite.invitedEmail}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{invite.invitedRole}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(invite.status)}>{invite.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Invite Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invite</DialogTitle>
            <DialogDescription>Invite someone to join your organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!email.trim() || createInvite.isPending}>
              {createInvite.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeConfirmId} onOpenChange={() => setRevokeConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invite?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the invitation link. The person will no longer be able to join using this invite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function OrgInvitesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);

  return (
    <Suspense fallback={<TableSkeleton rows={5} />}>
      <InvitesPageContent orgId={orgId} />
    </Suspense>
  );
}
