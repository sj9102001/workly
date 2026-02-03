"use client";

import Link from "next/link";
import { Mail, ExternalLink, Building2 } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
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
import { useMyInvites } from "@/hooks/use-queries";
import { Skeleton } from "@/components/ui/skeleton";

function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "ACCEPTED":
      return "default";
    case "DECLINED":
    case "REVOKED":
    case "EXPIRED":
      return "destructive";
    default:
      return "outline";
  }
}

export default function MyInvitesPage() {
  const { data: invites = [], isLoading } = useMyInvites();

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "My Invites" },
        ]}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6" />
            My Invites
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invitations sent to you. Open an invite to accept or decline.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-md border">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : invites.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-medium">No invites</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You don&apos;t have any pending or past invitations.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.orgName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.invitedRole}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(invite.status)}>
                        {invite.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {invite.status === "PENDING" ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={invite.acceptUrl}>
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            Accept / Decline
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={invite.acceptUrl}>View</Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </>
  );
}
