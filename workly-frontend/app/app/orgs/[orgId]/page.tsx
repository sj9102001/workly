"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import {
  Plus,
  Mail,
  ArrowRight,
  CircleDot,
  Zap,
  Users as UsersIcon,
  FolderKanban,
  Activity as ActivityIcon,
} from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { PageSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import {
  useOrganization,
  useProjects,
  useOrgMembers,
  useInvites,
} from "@/hooks/use-queries";
import { issueApi } from "@/lib/api";
import type { IssueResponse, Priority } from "@/lib/types";
import {
  WorklyAvatar,
  ProgressBar,
  Donut,
  PriorityGlyph,
  PRIORITY_META,
} from "@/components/workly/primitives";

const PROJECT_HUES = [45, 245, 295, 150, 195, 70];

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-card flex flex-col gap-2 rounded-xl border p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-[11.5px] font-semibold">{label}</span>
        <Icon className="text-text-faint h-3.5 w-3.5" />
      </div>
      <div className="flex items-end gap-1.5">
        <span className="font-display tnum text-[27px] font-bold leading-none tracking-tight">
          {value}
        </span>
        {sub && <span className="text-text-faint mb-0.5 text-xs font-medium">{sub}</span>}
      </div>
    </div>
  );
}

function CardHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-start justify-between gap-2.5">
      <div>
        <div className="font-display text-[14.5px] font-bold tracking-tight">{title}</div>
        {sub && <div className="text-text-faint mt-px text-[11.5px]">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export default function OrgDashboardPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const orgIdNum = Number(orgId);
  const router = useRouter();

  const { data: org, isLoading: orgLoading } = useOrganization(orgIdNum);
  const { data: projects, isLoading: projectsLoading } = useProjects(orgIdNum);
  const { data: members, isLoading: membersLoading } = useOrgMembers(orgIdNum);
  const { data: invites, isLoading: invitesLoading } = useInvites(orgIdNum);

  // Fetch issues per project in parallel to power the real-information widgets.
  const issueQueries = useQueries({
    queries: (projects ?? []).map((p) => ({
      queryKey: ["issues", orgIdNum, p.id, undefined] as const,
      queryFn: () => issueApi.list(orgIdNum, p.id),
      enabled: !!projects,
    })),
  });

  const allIssues: IssueResponse[] = useMemo(
    () => issueQueries.flatMap((q) => q.data ?? []),
    [issueQueries]
  );

  const isLoading = orgLoading || projectsLoading || membersLoading || invitesLoading;

  if (isLoading) {
    return (
      <>
        <AppTopbar breadcrumbs={[{ label: "Organizations", href: "/app/orgs" }, { label: "Loading..." }]} />
        <main className="flex-1 overflow-auto p-6">
          <PageSkeleton />
        </main>
      </>
    );
  }

  if (!org) {
    return (
      <>
        <AppTopbar breadcrumbs={[{ label: "Organizations", href: "/app/orgs" }, { label: "Not Found" }]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Organization not found</h1>
            <p className="text-muted-foreground mt-2">The organization you&apos;re looking for doesn&apos;t exist.</p>
            <Button className="mt-4" onClick={() => router.push("/app/orgs")}>
              Go to Organizations
            </Button>
          </div>
        </main>
      </>
    );
  }

  const pendingInvites = invites?.filter((i) => i.status === "PENDING") ?? [];
  const openIssues = allIssues.filter((i) => i.status !== "DONE");
  const inProgress = allIssues.filter((i) => i.status === "IN_PROGRESS" || i.status === "IN_REVIEW");

  // status distribution (donut)
  const dist = [
    { key: "TO_DO", label: "To Do", color: "var(--blue)" },
    { key: "IN_PROGRESS", label: "In Progress", color: "var(--amber)" },
    { key: "IN_REVIEW", label: "In Review", color: "var(--violet)" },
    { key: "DONE", label: "Done", color: "var(--green)" },
  ].map((s) => ({ ...s, n: allIssues.filter((i) => i.status === s.key).length }));
  const donutSegs = dist.map((d) => ({ value: d.n, color: d.color }));

  // workload by assignee
  const workload = (members ?? [])
    .map((m) => ({ m, n: openIssues.filter((i) => i.assigneeId === m.userId).length }))
    .filter((w) => w.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);
  const wlMax = Math.max(...workload.map((w) => w.n), 1);

  // due-soon + priority across open issues
  const priorityBuckets = (["HIGHEST", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => ({
    p,
    n: openIssues.filter((i) => i.priority === p).length,
  }));

  // per-project progress
  const projectStats = (projects ?? []).map((p, idx) => {
    const pIssues = allIssues.filter((i) => i.projectId === p.id);
    const done = pIssues.filter((i) => i.status === "DONE").length;
    return {
      ...p,
      hue: PROJECT_HUES[idx % PROJECT_HUES.length],
      open: pIssues.filter((i) => i.status !== "DONE").length,
      prog: pIssues.length ? done / pIssues.length : 0,
    };
  });

  return (
    <>
      <AppTopbar breadcrumbs={[{ label: "Organizations", href: "/app/orgs" }, { label: org.name }]} />

      <main className="view-enter flex-1 overflow-auto px-6 pb-16 pt-5">
        <div className="mx-auto max-w-[1180px]">
          {/* header */}
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-text-muted mb-1 text-xs font-semibold">{org.name} workspace</div>
              <h1 className="font-display text-[26px] font-bold leading-none tracking-tight">
                Workspace overview
              </h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/app/orgs/${orgId}/invites?create=true`}>
                  <Mail className="mr-1.5 h-3.5 w-3.5" /> Invite
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/app/orgs/${orgId}/projects?create=true`}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> New project
                </Link>
              </Button>
            </div>
          </div>

          {/* stat tiles */}
          <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Open issues" value={openIssues.length} icon={CircleDot} />
            <StatTile label="In progress" value={inProgress.length} sub="active" icon={Zap} />
            <StatTile label="Members" value={members?.length ?? 0} icon={UsersIcon} />
            <StatTile label="Projects" value={projects?.length ?? 0} icon={FolderKanban} />
          </div>

          {/* main grid */}
          <div className="mb-3 grid gap-3 lg:grid-cols-[1.55fr_1fr]">
            {/* projects */}
            <div className="bg-card rounded-xl border p-4">
              <CardHead
                title="Projects"
                sub={`${projects?.length ?? 0} active`}
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/app/orgs/${orgId}/projects`}>
                      View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                }
              />
              {projectStats.length === 0 ? (
                <p className="text-text-muted text-sm">No projects yet. Create your first project to get started.</p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {projectStats.map((p) => (
                    <Link
                      key={p.id}
                      href={`/app/orgs/${orgId}/projects/${p.id}`}
                      className="hover:bg-hover flex items-center gap-3 rounded-md p-2 transition-colors"
                    >
                      <div
                        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg text-white"
                        style={{ background: `oklch(0.62 0.16 ${p.hue})` }}
                      >
                        <span className="font-mono text-[10px] font-bold">
                          {p.slug?.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 text-[13px] font-semibold">{p.name}</div>
                        <div className="flex items-center gap-2">
                          <div className="max-w-[130px] flex-1">
                            <ProgressBar value={p.prog} height={5} color={`oklch(0.62 0.16 ${p.hue})`} />
                          </div>
                          <span className="text-text-faint text-[10.5px] font-semibold">
                            {Math.round(p.prog * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono tnum text-[13px] font-semibold">{p.open}</div>
                        <div className="text-text-faint text-[10px]">open</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* issue breakdown donut */}
            <div className="bg-card flex flex-col rounded-xl border p-4">
              <CardHead title="Issue breakdown" sub="By status across all projects" />
              <div className="flex flex-1 items-center gap-4">
                <div className="relative shrink-0">
                  <Donut segments={donutSegs} size={104} thickness={15} />
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <div className="font-display tnum text-2xl font-bold leading-none">
                        {allIssues.length}
                      </div>
                      <div className="text-text-faint text-[10px] font-semibold">total</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  {dist.map((d) => (
                    <div key={d.key} className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: d.color }} />
                      <span className="text-text-2 flex-1 text-xs font-medium">{d.label}</span>
                      <span className="font-mono tnum text-xs font-semibold">{d.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* row 3: workload + priority + members */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="bg-card rounded-xl border p-4">
              <CardHead title="Team workload" sub="Open issues per assignee" />
              {workload.length === 0 ? (
                <p className="text-text-faint text-xs">No assigned open issues.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {workload.map((w) => (
                    <div key={w.m.userId} className="flex items-center gap-2.5">
                      <WorklyAvatar name={w.m.userName} size={22} />
                      <span className="w-[110px] shrink-0 truncate text-xs font-medium">{w.m.userName}</span>
                      <div className="flex-1">
                        <ProgressBar value={w.n / wlMax} height={6} />
                      </div>
                      <span className="font-mono tnum w-4 text-right text-xs font-semibold">{w.n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border p-4">
              <CardHead title="Priority breakdown" sub="Open issues by priority" />
              <div className="flex flex-col gap-2">
                {priorityBuckets.map((b) => (
                  <div key={b.p} className="flex items-center gap-2.5">
                    <PriorityGlyph priority={b.p} size={14} />
                    <span className="text-text-2 flex-1 text-xs font-medium">{PRIORITY_META[b.p].label}</span>
                    <div className="w-28">
                      <ProgressBar
                        value={openIssues.length ? b.n / openIssues.length : 0}
                        height={6}
                        color={PRIORITY_META[b.p].color}
                      />
                    </div>
                    <span className="font-mono tnum w-4 text-right text-xs font-semibold">{b.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* members */}
          <div className="bg-card mt-3 rounded-xl border p-4">
            <CardHead
              title="Members"
              sub={`${members?.length ?? 0} people in ${org.name}`}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/app/orgs/${orgId}/members`}>
                    View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <div className="flex flex-col">
              {(members ?? []).slice(0, 6).map((m, i) => (
                <div
                  key={m.userId}
                  className={`flex items-center gap-3 py-2 ${i ? "border-border-soft border-t" : ""}`}
                >
                  <WorklyAvatar name={m.userName} size={24} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold leading-tight">{m.userName}</div>
                    <div className="text-text-faint text-[11px]">{m.userEmail}</div>
                  </div>
                  <span className="text-text-muted bg-surface-3 rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-text-faint mt-4 flex items-center gap-1.5 text-[11px]">
            <ActivityIcon className="h-3 w-3" />
            Per-project sprint, burndown &amp; activity live inside each project board.
          </div>
        </div>
      </main>
    </>
  );
}
