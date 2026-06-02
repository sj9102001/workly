"use client";

import { use } from "react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { NoMembers } from "@/components/app-shell/empty-states";
import { TableSkeleton } from "@/components/app-shell/skeletons";
import { useOrganization, useOrgMembers } from "@/hooks/use-queries";
import { WorklyAvatar } from "@/components/workly/primitives";

export default function OrgMembersPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const orgIdNum = Number(orgId);

  const { data: org } = useOrganization(orgIdNum);
  const { data: members, isLoading } = useOrgMembers(orgIdNum);

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Members" },
        ]}
      />

      <main className="view-enter flex-1 overflow-auto px-6 pb-16 pt-5">
        <div className="mx-auto max-w-[980px]">
          <div className="mb-5">
            <h1 className="font-display text-[22px] font-bold leading-none tracking-tight">Members</h1>
            <p className="text-text-muted mt-1.5 text-[12.5px]">
              {members?.length ?? 0} people in {org?.name ?? "this organization"}
            </p>
          </div>

          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : members?.length === 0 ? (
            <NoMembers />
          ) : (
            <div className="bg-card overflow-hidden rounded-xl border">
              <div className="text-text-faint border-border grid grid-cols-[2.2fr_1fr_0.8fr] gap-3 border-b px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider">
                <span>Member</span>
                <span>Role</span>
                <span className="text-right">Joined</span>
              </div>
              {members?.map((member, i) => (
                <div
                  key={member.userId}
                  className={`hover:bg-hover grid grid-cols-[2.2fr_1fr_0.8fr] items-center gap-3 px-4 py-2.5 transition-colors ${
                    i ? "border-border-soft border-t" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <WorklyAvatar name={member.userName} size={30} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold">{member.userName}</div>
                      <div className="text-text-faint text-[11.5px]">{member.userEmail}</div>
                    </div>
                  </div>
                  <span>
                    <span
                      className="inline-flex items-center rounded-[5px] border px-1.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        background: member.role === "OWNER" ? "var(--accent-soft)" : "var(--surface-3)",
                        color: member.role === "OWNER" ? "var(--accent-text)" : "var(--text-muted)",
                        borderColor: member.role === "OWNER" ? "var(--accent-soft-bd)" : "var(--border)",
                      }}
                    >
                      {member.role}
                    </span>
                  </span>
                  <span className="text-text-muted text-right font-mono text-[12px]">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
