"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useProject,
  useColumns,
  useIssue,
  useUpdateIssue,
  useMoveIssue,
  useProjectMembers,
  useLabels,
  useSprints,
  useSubtasks,
  useAddSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
} from "@/hooks/use-queries";
import { useAuth } from "@/lib/auth";
import { IssueComments } from "@/components/app-shell/issue-comments";
import { Skeleton } from "@/components/ui/skeleton";
import type { Priority, IssueStatus } from "@/lib/types";
import {
  PriorityGlyph,
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
  LabelChip,
  WorklyAvatar,
  ProgressBar,
} from "@/components/workly/primitives";

interface IssueDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: number;
  projectId: number;
  issueId: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-text-faint mb-2 text-[11px] font-bold uppercase tracking-wider">
      {children}
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[30px] items-center gap-2.5">
      <span className="text-text-muted w-[78px] shrink-0 text-xs font-medium">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function IssueDetailPanel({ open, onOpenChange, orgId, projectId, issueId }: IssueDetailPanelProps) {
  const { userId: currentUserId } = useAuth();
  const { data: project } = useProject(open ? orgId : null, projectId);
  const { data: columns } = useColumns(open ? orgId : null, open ? projectId : null);
  const { data: issue, isLoading } = useIssue(open ? orgId : null, open ? projectId : null, open ? issueId : null);
  const { data: projectMembers = [] } = useProjectMembers(open ? orgId : null, open ? projectId : null);
  const { data: labels = [] } = useLabels(open ? orgId : null, open ? projectId : null);
  const { data: sprints = [] } = useSprints(open ? orgId : null, open ? projectId : null);
  const { data: subtasks = [] } = useSubtasks(open ? orgId : null, open ? projectId : null, open ? issueId : null);

  const updateIssue = useUpdateIssue();
  const moveIssue = useMoveIssue();
  const addSubtask = useAddSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description ?? "");
    }
  }, [issue]);

  const memberName = (userId: number | null) =>
    userId != null ? projectMembers.find((m) => m.userId === userId)?.userName ?? null : null;

  const col = columns?.find((c) => c.id === issue?.columnId);
  const subDone = subtasks.filter((s) => s.done).length;

  const labelIds = useMemo(() => new Set((issue?.labels ?? []).map((l) => l.id)), [issue]);

  const saveField = (data: Parameters<typeof updateIssue.mutateAsync>[0]["data"]) =>
    updateIssue.mutate({ orgId, projectId, issueId, data });

  const handleTitleBlur = () => {
    if (issue && title.trim() && title !== issue.title) saveField({ title: title.trim() });
  };
  const handleDescBlur = () => {
    if (issue && description !== (issue.description ?? "")) saveField({ description });
  };

  const setStatusColumn = (columnId: number) => {
    const c = columns?.find((x) => x.id === columnId);
    const statusGuess = c
      ? (STATUS_ORDER.find((s) => STATUS_META[s].label.toLowerCase() === c.name.toLowerCase()) as IssueStatus | undefined)
      : undefined;
    moveIssue.mutate({ orgId, projectId, issueId, data: { columnId, status: statusGuess } });
  };

  const toggleLabel = (id: number) => {
    const next = new Set(labelIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    saveField({ labelIds: Array.from(next) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-background w-[min(760px,96vw)] gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <SheetTitle className="sr-only">{`Issue WRK-${issueId}`}</SheetTitle>

        {/* header */}
        <div className="border-border flex h-[50px] shrink-0 items-center gap-2.5 border-b px-4">
          <span className="text-text-muted font-mono text-xs font-semibold">WRK-{issueId}</span>
          <div className="flex-1" />
        </div>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !issue ? (
          <div className="text-muted-foreground p-6 text-center">Issue not found.</div>
        ) : (
          <div className="flex min-h-0 flex-1">
            {/* main column */}
            <div className="min-w-0 flex-1 overflow-y-auto px-6 pb-12 pt-5">
              {/* breadcrumb */}
              <div className="mb-3.5 flex items-center gap-1.5">
                <span className="bg-accent grid h-4 w-4 place-items-center rounded-[5px] text-white">
                  <span className="font-mono text-[7px] font-bold">{project?.slug?.slice(0, 3).toUpperCase()}</span>
                </span>
                <span className="text-text-muted text-xs font-medium">{project?.name}</span>
              </div>

              {/* title */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="font-display h-auto border-none bg-transparent p-0 text-[23px] font-bold leading-tight tracking-tight shadow-none focus-visible:ring-0"
                placeholder="Issue title"
              />

              {/* labels */}
              {issue.labels.length > 0 && (
                <div className="mb-4 mt-3 flex flex-wrap gap-1.5">
                  {issue.labels.map((l) => (
                    <LabelChip key={l.id} label={l} dot />
                  ))}
                </div>
              )}

              {/* description */}
              <div className="mt-5">
                <SectionLabel>Description</SectionLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleDescBlur}
                  placeholder="Add a description…"
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* subtasks */}
              <div className="mt-6">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <SectionLabel>Subtasks</SectionLabel>
                    {subtasks.length > 0 && (
                      <span className="text-text-muted -mt-2 text-[11px] font-semibold">
                        {subDone}/{subtasks.length}
                      </span>
                    )}
                  </div>
                </div>
                {subtasks.length > 0 && (
                  <div className="mb-2.5">
                    <ProgressBar value={subDone / subtasks.length} height={5} color="var(--green)" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  {subtasks.map((s) => (
                    <div key={s.id} className="hover:bg-hover group flex items-center gap-2.5 rounded-md p-1.5">
                      <button
                        onClick={() =>
                          updateSubtask.mutate({ orgId, projectId, issueId, subtaskId: s.id, data: { done: !s.done } })
                        }
                        className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border"
                        style={{
                          borderColor: s.done ? "var(--green)" : "var(--border-strong)",
                          background: s.done ? "var(--green)" : "transparent",
                        }}
                      >
                        {s.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </button>
                      <span
                        className="flex-1 text-[12.5px]"
                        style={{
                          color: s.done ? "var(--text-faint)" : "var(--foreground)",
                          textDecoration: s.done ? "line-through" : "none",
                        }}
                      >
                        {s.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask.mutate({ orgId, projectId, issueId, subtaskId: s.id })}
                        className="text-text-faint hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSubtask.trim()) {
                        addSubtask.mutate({ orgId, projectId, issueId, title: newSubtask.trim() });
                        setNewSubtask("");
                      }
                    }}
                    placeholder="Add a subtask…"
                    className="h-8 text-[12.5px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={!newSubtask.trim()}
                    onClick={() => {
                      addSubtask.mutate({ orgId, projectId, issueId, title: newSubtask.trim() });
                      setNewSubtask("");
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="bg-border my-6 h-px" />

              {/* activity / comments */}
              <SectionLabel>Activity</SectionLabel>
              <IssueComments orgId={orgId} projectId={projectId} issueId={issueId} currentUserId={currentUserId ?? null} compact />
            </div>

            {/* properties sidebar */}
            <div className="border-border w-[244px] shrink-0 overflow-y-auto border-l p-4" style={{ background: "var(--bg-grad)" }}>
              <PropRow label="Status">
                <Select value={issue.columnId ? String(issue.columnId) : ""} onValueChange={(v) => setStatusColumn(Number(v))}>
                  <SelectTrigger className="h-7 w-full border-none bg-transparent px-2 shadow-none">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-[3px]" style={{ background: STATUS_META[issue.status].color }} />
                      <span>{col?.name ?? "—"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {columns?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropRow>

              <PropRow label="Priority">
                <Select value={issue.priority} onValueChange={(v) => saveField({ priority: v as Priority })}>
                  <SelectTrigger className="h-7 w-full border-none bg-transparent px-2 shadow-none">
                    <div className="flex items-center gap-2">
                      <PriorityGlyph priority={issue.priority} size={13} />
                      <span>{PRIORITY_META[issue.priority].label}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_ORDER.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_META[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropRow>

              <PropRow label="Assignee">
                <Select
                  value={issue.assigneeId != null ? String(issue.assigneeId) : "__none__"}
                  onValueChange={(v) =>
                    v === "__none__"
                      ? saveField({ assigneeId: undefined })
                      : saveField({ assigneeId: Number(v) })
                  }
                >
                  <SelectTrigger className="h-7 w-full border-none bg-transparent px-2 shadow-none">
                    <div className="flex items-center gap-2 truncate">
                      <WorklyAvatar name={memberName(issue.assigneeId)} size={20} />
                      <span className="truncate">{memberName(issue.assigneeId) ?? "Unassigned"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {projectMembers.map((m) => (
                      <SelectItem key={m.userId} value={String(m.userId)}>
                        {m.userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropRow>

              <PropRow label="Estimate">
                <Select
                  value={issue.storyPoints != null ? String(issue.storyPoints) : "__none__"}
                  onValueChange={(v) =>
                    v === "__none__"
                      ? saveField({ clearStoryPoints: true })
                      : saveField({ storyPoints: Number(v) })
                  }
                >
                  <SelectTrigger className="h-7 w-full border-none bg-transparent px-2 shadow-none">
                    <span className="bg-surface-3 text-text-muted mr-1.5 rounded-[5px] px-1.5 font-mono text-[11px] font-semibold">
                      {issue.storyPoints ?? "—"}
                    </span>
                    <span className="text-text-muted text-xs">points</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No estimate</SelectItem>
                    {[1, 2, 3, 5, 8, 13].map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {p} points
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropRow>

              <PropRow label="Due date">
                <Input
                  type="date"
                  value={issue.dueDate ?? ""}
                  onChange={(e) =>
                    e.target.value ? saveField({ dueDate: e.target.value }) : saveField({ clearDueDate: true })
                  }
                  className="h-7 border-none bg-transparent px-2 text-xs shadow-none"
                />
              </PropRow>

              <PropRow label="Sprint">
                <Select
                  value={issue.sprintId != null ? String(issue.sprintId) : "__none__"}
                  onValueChange={(v) =>
                    v === "__none__" ? saveField({ clearSprint: true }) : saveField({ sprintId: Number(v) })
                  }
                >
                  <SelectTrigger className="h-7 w-full border-none bg-transparent px-2 text-xs shadow-none">
                    <SelectValue placeholder="No sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No sprint</SelectItem>
                    {sprints.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropRow>

              <PropRow label="Labels">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="hover:bg-hover flex min-h-[27px] w-full flex-wrap items-center gap-1 rounded-md px-2 py-1 text-left">
                      {issue.labels.length ? (
                        issue.labels.map((l) => <LabelChip key={l.id} label={l} />)
                      ) : (
                        <span className="text-text-faint text-xs">Add labels…</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-56 p-1.5">
                    {labels.length === 0 && (
                      <div className="text-text-faint p-2 text-xs">No labels in this project yet.</div>
                    )}
                    {labels.map((l) => {
                      const on = labelIds.has(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() => toggleLabel(l.id)}
                          className="hover:bg-hover flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left"
                        >
                          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: l.color }} />
                          <span className="flex-1 text-[12.5px]">{l.name}</span>
                          {on && <Check className="text-accent h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </PopoverContent>
                </Popover>
              </PropRow>

              <div className="bg-border my-3.5 h-px" />
              <div className="text-text-faint flex flex-col gap-1.5 text-[11.5px]">
                <div className="flex justify-between">
                  <span>Reporter</span>
                  <span>{memberName(issue.reporterId) ?? `User #${issue.reporterId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="font-mono">{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span className="font-mono">{new Date(issue.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Back-compat alias for existing importers.
export const IssueDetailModal = IssueDetailPanel;
