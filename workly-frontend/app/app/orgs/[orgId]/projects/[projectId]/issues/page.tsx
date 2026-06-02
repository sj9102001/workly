"use client";

import { use, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { IssueDetailPanel } from "@/components/app-shell/issue-detail-modal";
import { NoIssues } from "@/components/app-shell/empty-states";
import { TableSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useOrganization,
  useProject,
  useColumns,
  useIssues,
  useCreateIssue,
  useProjectMembers,
} from "@/hooks/use-queries";
import type { Priority, IssueStatus } from "@/lib/types";
import {
  PriorityGlyph,
  LabelChip,
  WorklyAvatar,
  STATUS_META,
} from "@/components/workly/primitives";

function IssuesPageContent({ orgId, projectId }: { orgId: string; projectId: string }) {
  const orgIdNum = Number(orgId);
  const projectIdNum = Number(projectId);
  const router = useRouter();
  const searchParams = useSearchParams();

  const columnIdParam = searchParams.get("columnId");
  const statusParam = searchParams.get("status");

  const { data: org } = useOrganization(orgIdNum);
  const { data: project } = useProject(orgIdNum, projectIdNum);
  const { data: columns } = useColumns(orgIdNum, projectIdNum);
  const { data: projectMembers = [] } = useProjectMembers(orgIdNum, projectIdNum);
  const { data: issues, isLoading } = useIssues(orgIdNum, projectIdNum, {
    columnId: columnIdParam ? Number(columnIdParam) : undefined,
    status: statusParam || undefined,
  });
  const createIssue = useCreateIssue();

  const memberName = (userId: number | null) =>
    userId != null ? projectMembers.find((m) => m.userId === userId)?.userName ?? null : null;

  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TO_DO",
    columnId: "",
  });

  const handleCreate = async () => {
    if (!newIssue.title.trim() || !newIssue.columnId) return;
    await createIssue.mutateAsync({
      orgId: orgIdNum,
      projectId: projectIdNum,
      data: {
        title: newIssue.title,
        description: newIssue.description || undefined,
        priority: newIssue.priority as Priority,
        status: newIssue.status as IssueStatus,
        columnId: Number(newIssue.columnId),
      },
    });
    setIsCreateOpen(false);
    setNewIssue({ title: "", description: "", priority: "MEDIUM", status: "TO_DO", columnId: columns?.[0]?.id ? String(columns[0].id) : "" });
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Projects", href: `/app/orgs/${orgId}/projects` },
          { label: project?.name || "...", href: `/app/orgs/${orgId}/projects/${projectId}` },
          { label: "Issues" },
        ]}
      />

      <main className="view-enter flex-1 overflow-auto px-6 pb-16 pt-5">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-[22px] font-bold leading-none tracking-tight">Issues</h1>
              <p className="text-text-muted mt-1.5 text-[12.5px]">
                {issues?.length ?? 0} issues in {project?.name ?? "this project"}
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Issue
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex gap-3">
            <Select value={columnIdParam || "all"} onValueChange={(v) => updateFilter("columnId", v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Columns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Columns</SelectItem>
                {columns?.map((column) => (
                  <SelectItem key={column.id} value={String(column.id)}>
                    {column.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusParam || "all"} onValueChange={(v) => updateFilter("status", v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="TO_DO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : issues?.length === 0 ? (
            <NoIssues onCreateIssue={() => setIsCreateOpen(true)} />
          ) : (
            <div className="bg-card overflow-hidden rounded-xl border">
              {issues?.map((issue, idx) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={`hover:bg-hover flex h-11 w-full items-center gap-3 px-3 text-left transition-colors ${
                    idx ? "border-border-soft border-t" : ""
                  }`}
                >
                  <PriorityGlyph priority={issue.priority} size={13} />
                  <span className="text-text-faint w-14 shrink-0 font-mono text-[11px]">WRK-{issue.id}</span>
                  <span className="flex-1 truncate text-[13px] font-medium">{issue.title}</span>
                  <div className="hidden gap-1 md:flex">
                    {issue.labels.slice(0, 2).map((l) => (
                      <LabelChip key={l.id} label={l} />
                    ))}
                  </div>
                  {issue.storyPoints != null && (
                    <span className="bg-surface-3 text-text-muted rounded-[5px] px-1.5 font-mono text-[11px] font-semibold">
                      {issue.storyPoints}
                    </span>
                  )}
                  <span
                    className="hidden items-center gap-1.5 text-[11.5px] font-medium sm:inline-flex"
                    style={{ color: STATUS_META[issue.status].color }}
                  >
                    <span className="h-2 w-2 rounded-[3px]" style={{ background: STATUS_META[issue.status].color }} />
                    {STATUS_META[issue.status].label}
                  </span>
                  <WorklyAvatar name={memberName(issue.assigneeId)} size={20} />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Issue Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Issue</DialogTitle>
            <DialogDescription>Add a new issue to track work.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Issue title"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue..."
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newIssue.priority}
                  onValueChange={(v) => setNewIssue({ ...newIssue, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGHEST">Highest</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="LOWEST">Lowest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newIssue.status}
                  onValueChange={(v) => setNewIssue({ ...newIssue, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TO_DO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Column *</Label>
              <Select
                value={newIssue.columnId}
                onValueChange={(v) => setNewIssue({ ...newIssue, columnId: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column (required)" />
                </SelectTrigger>
                <SelectContent>
                  {columns?.map((column) => (
                    <SelectItem key={column.id} value={String(column.id)}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newIssue.title.trim() || !newIssue.columnId || createIssue.isPending}>
              {createIssue.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedIssueId !== null && (
        <IssueDetailPanel
          open={selectedIssueId !== null}
          onOpenChange={(open) => !open && setSelectedIssueId(null)}
          orgId={orgIdNum}
          projectId={projectIdNum}
          issueId={selectedIssueId}
        />
      )}
    </>
  );
}

export default function IssuesPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = use(params);

  return (
    <Suspense fallback={<TableSkeleton rows={10} />}>
      <IssuesPageContent orgId={orgId} projectId={projectId} />
    </Suspense>
  );
}
