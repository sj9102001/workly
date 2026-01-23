"use client";

import { use } from "react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { NoMembers } from "@/components/app-shell/empty-states";
import { TableSkeleton } from "@/components/app-shell/skeletons";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrganization, useOrgMembers } from "@/hooks/use-queries";

export default function OrgMembersPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const orgIdNum = Number(orgId);

  const { data: org } = useOrganization(orgIdNum);
  const { data: members, isLoading } = useOrgMembers(orgIdNum);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Members" },
        ]}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">Team members in this organization</p>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : members?.length === 0 ? (
          <NoMembers />
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {member.userName?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.userName}</p>
                          <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
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
