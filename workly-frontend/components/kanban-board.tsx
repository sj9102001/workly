"use client";

import React, { useState, useCallback } from "react";
import { Plus, MoreHorizontal, X, Search, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import {
  useColumns,
  useIssues,
  useCreateIssue,
  useMoveIssue,
  useCreateColumn,
  useDeleteColumn,
  useProjectMembers,
  useActiveSprint,
} from "@/hooks/use-queries";
import { IssueDetailPanel } from "@/components/app-shell/issue-detail-modal";
import { useQueryClient } from "@tanstack/react-query";
import type { IssueResponse, Priority } from "@/lib/types";
import {
  PriorityGlyph,
  PRIORITY_META,
  LabelChip,
  WorklyAvatar,
  ProgressBar,
  dueLabel,
} from "@/components/workly/primitives";

// Heuristic accent color for a column based on its name (To Do / In Progress / …).
function columnAccent(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("backlog")) return "var(--text-faint)";
  if (n.includes("todo") || n.includes("to do")) return "var(--blue)";
  if (n.includes("progress")) return "var(--amber)";
  if (n.includes("review")) return "var(--violet)";
  if (n.includes("done") || n.includes("complete")) return "var(--green)";
  return "var(--text-faint)";
}

interface KanbanBoardProps {
  orgId: number;
  projectId: number;
}

function IssueCard({
  issue,
  assigneeName,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  issue: IssueResponse;
  assigneeName: string | null;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const due = dueLabel(issue.dueDate);
  const dueColor = due?.tone === "red" ? "var(--red)" : due?.tone === "amber" ? "var(--amber)" : "var(--text-faint)";
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onOpen}
      className="bg-card hover:border-border-strong flex cursor-pointer flex-col gap-1.5 rounded-[10px] border p-2.5 shadow-sm transition-all hover:shadow-md"
      style={{ opacity: dragging ? 0.4 : 1 }}
    >
      {/* top row */}
      <div className="flex items-center gap-1.5">
        <PriorityGlyph priority={issue.priority} size={13} />
        <span className="text-text-faint font-mono text-[10.5px] font-semibold">WRK-{issue.id}</span>
        <div className="flex-1" />
        {assigneeName && <WorklyAvatar name={assigneeName} size={19} />}
      </div>
      {/* title */}
      <div className="text-[13px] font-medium leading-snug">{issue.title}</div>
      {/* labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {issue.labels.map((l) => (
            <LabelChip key={l.id} label={l} dot />
          ))}
        </div>
      )}
      {/* meta footer */}
      <div className="mt-0.5 flex items-center gap-2.5">
        {issue.storyPoints != null && (
          <span className="bg-surface-3 text-text-muted rounded-[5px] px-1.5 font-mono text-[11px] font-semibold">
            {issue.storyPoints}
          </span>
        )}
        {due && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: dueColor }}>
            <Calendar className="h-3 w-3" /> {due.text}
          </span>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ orgId, projectId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: columns = [], isLoading: columnsLoading } = useColumns(orgId, projectId);
  const { data: allIssues = [], isLoading: issuesLoading } = useIssues(orgId, projectId);
  const { data: projectMembers = [] } = useProjectMembers(orgId, projectId);
  const { data: activeSprint } = useActiveSprint(orgId, projectId);
  const createIssue = useCreateIssue();
  const moveIssue = useMoveIssue();
  const createColumn = useCreateColumn();
  const deleteColumn = useDeleteColumn();

  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [isDeleteColumnOpen, setIsDeleteColumnOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<number | null>(null);
  const [newIssue, setNewIssue] = useState({ title: "", description: "", priority: "MEDIUM" });
  const [newColumnName, setNewColumnName] = useState("");
  const [draggingIssue, setDraggingIssue] = useState<IssueResponse | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priFilter, setPriFilter] = useState<Priority | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  const memberName = (userId: number | null) =>
    userId != null ? projectMembers.find((m) => m.userId === userId)?.userName ?? null : null;

  const sortedColumns = [...columns].sort((a, b) => a.orderIndex - b.orderIndex);

  const getIssuesByColumn = (columnId: number) =>
    allIssues
      .filter((issue) => issue.columnId === columnId)
      .filter((issue) => searchQuery === "" || issue.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((issue) => priFilter === null || issue.priority === priFilter)
      .sort((a, b) => a.orderIndex - b.orderIndex);

  // sprint points meter
  const totalPts = allIssues.reduce((s, i) => s + (i.storyPoints ?? 0), 0);
  const donePts = allIssues.filter((i) => i.status === "DONE").reduce((s, i) => s + (i.storyPoints ?? 0), 0);

  const handleCreateIssue = async (columnId: number) => {
    if (!newIssue.title.trim()) return;
    try {
      await createIssue.mutateAsync({
        orgId,
        projectId,
        data: {
          title: newIssue.title,
          description: newIssue.description || undefined,
          priority: newIssue.priority as Priority,
          columnId,
        },
      });
      setIsCreateIssueOpen(false);
      setNewIssue({ title: "", description: "", priority: "MEDIUM" });
      setSelectedColumnId(null);
    } catch {
      /* handled by mutation */
    }
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      await createColumn.mutateAsync({ orgId, projectId, name: newColumnName.trim() });
      setIsCreateColumnOpen(false);
      setNewColumnName("");
    } catch {
      /* handled */
    }
  };

  const handleDeleteColumn = async () => {
    if (!columnToDelete) return;
    try {
      await deleteColumn.mutateAsync({ orgId, projectId, columnId: columnToDelete });
      setIsDeleteColumnOpen(false);
      setColumnToDelete(null);
    } catch {
      /* handled */
    }
  };

  const handleDrop = useCallback(
    async (targetColumnId: number, targetIssue?: IssueResponse) => {
      if (!draggingIssue || draggingIssue.columnId === targetColumnId) {
        setDraggingIssue(null);
        setDragOverColumn(null);
        return;
      }
      const previousIssues = queryClient.getQueryData<IssueResponse[]>(["issues", orgId, projectId, undefined]);
      queryClient.setQueryData<IssueResponse[]>(["issues", orgId, projectId, undefined], (old) =>
        old?.map((i) => (i.id === draggingIssue.id ? { ...i, columnId: targetColumnId } : i))
      );
      try {
        const moveData: { columnId: number; afterIssueId?: number } = { columnId: targetColumnId };
        if (targetIssue && targetIssue.id !== draggingIssue.id) moveData.afterIssueId = targetIssue.id;
        await moveIssue.mutateAsync({ orgId, projectId, issueId: draggingIssue.id, data: moveData });
      } catch {
        queryClient.setQueryData(["issues", orgId, projectId, undefined], previousIssues);
        toast({ title: "Failed to move issue", description: "Please try again.", variant: "destructive" });
      }
      setDraggingIssue(null);
      setDragOverColumn(null);
    },
    [draggingIssue, orgId, projectId, queryClient, moveIssue, toast]
  );

  const openCreateIssueDialog = (columnId: number) => {
    setSelectedColumnId(columnId);
    setIsCreateIssueOpen(true);
  };

  if (columnsLoading || issuesLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-text-muted text-sm">Loading board…</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* filter / toolbar row */}
      <div className="border-border flex shrink-0 items-center gap-2 border-b px-5 py-2">
        <Button variant="ghost" size="sm" className="text-text-muted h-8">
          <Filter className="h-3.5 w-3.5" /> Filter
        </Button>
        <span className="bg-border h-4 w-px" />
        <span className="text-text-faint text-[11.5px] font-semibold">Priority</span>
        {(["HIGHEST", "HIGH", "MEDIUM"] as Priority[]).map((p) => {
          const active = priFilter === p;
          return (
            <button
              key={p}
              onClick={() => setPriFilter(active ? null : p)}
              className="inline-flex h-[23px] items-center gap-1.5 rounded-[5px] border px-2 text-[11px] font-semibold"
              style={{
                borderColor: active ? "var(--accent-soft-bd)" : "var(--border)",
                background: active ? "var(--accent-soft)" : "var(--card)",
                color: active ? "var(--accent-text)" : "var(--text-2)",
              }}
            >
              <PriorityGlyph priority={p} size={12} />
              {PRIORITY_META[p].label}
            </button>
          );
        })}
        <div className="flex-1" />
        {/* sprint chip */}
        {activeSprint && (
          <span
            className="inline-flex h-[22px] items-center gap-1.5 rounded-[5px] border px-2 text-[11px] font-semibold"
            style={{ background: "var(--accent-soft)", color: "var(--accent-text)", borderColor: "var(--accent-soft-bd)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            {activeSprint.name}
          </span>
        )}
        {/* points meter */}
        {totalPts > 0 && (
          <div className="flex items-center gap-2" title="Story points completed">
            <div className="w-24">
              <ProgressBar value={totalPts ? donePts / totalPts : 0} height={5} />
            </div>
            <span className="text-text-muted font-mono tnum text-[11.5px] font-semibold">
              {donePts}/{totalPts} pts
            </span>
          </div>
        )}
        {/* search */}
        <div className="bg-card border-border flex h-8 w-44 items-center gap-1.5 rounded-md border px-2">
          <Search className="text-text-faint h-3.5 w-3.5" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter…"
            className="min-w-0 flex-1 border-none bg-transparent text-[12.5px] outline-none"
          />
        </div>
        <Button size="sm" className="h-8" onClick={() => setIsCreateColumnOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Column</span>
        </Button>
      </div>

      {/* board */}
      <div className="flex flex-1 items-stretch gap-1 overflow-x-auto p-4">
        {sortedColumns.map((column) => {
          const columnIssues = getIssuesByColumn(column.id);
          const accent = columnAccent(column.name);
          const isOver = dragOverColumn === column.id;
          return (
            <div
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(column.id);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(column.id);
              }}
              className="flex max-h-full w-[282px] shrink-0 flex-col rounded-xl transition-colors"
              style={{
                background: isOver ? "var(--surface-2)" : "transparent",
                outline: isOver ? "2px dashed var(--accent-soft-bd)" : "2px dashed transparent",
                outlineOffset: -2,
              }}
            >
              {/* column header */}
              <div className="flex items-center gap-2 px-2 pb-2 pt-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: accent }} />
                <span className="text-text-2 text-xs font-bold uppercase tracking-wide">{column.name}</span>
                <span className="text-text-faint bg-surface-3 font-mono tnum rounded-full px-1.5 py-px text-[11.5px] font-semibold">
                  {columnIssues.length}
                </span>
                <div className="flex-1" />
                <button
                  className="text-text-muted hover:bg-hover grid h-[22px] w-[22px] place-items-center rounded-md"
                  onClick={() => openCreateIssueDialog(column.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-text-muted hover:bg-hover grid h-[22px] w-[22px] place-items-center rounded-md">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openCreateIssueDialog(column.id)}>
                      <Plus className="mr-2 h-4 w-4" /> Create Issue
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setColumnToDelete(column.id);
                        setIsDeleteColumnOpen(true);
                      }}
                      className="text-destructive"
                    >
                      <X className="mr-2 h-4 w-4" /> Delete Column
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* cards */}
              <div className="flex min-h-[60px] flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-2">
                {columnIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    assigneeName={memberName(issue.assigneeId)}
                    dragging={draggingIssue?.id === issue.id}
                    onOpen={() => setSelectedIssueId(issue.id)}
                    onDragStart={() => setDraggingIssue(issue)}
                    onDragEnd={() => {
                      setDraggingIssue(null);
                      setDragOverColumn(null);
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(column.id, issue);
                    }}
                  />
                ))}
                {columnIssues.length === 0 && (
                  <div className="border-border text-text-faint flex h-20 items-center justify-center rounded-[10px] border border-dashed text-[11.5px]">
                    {searchQuery || priFilter ? "No matching issues" : "No issues"}
                  </div>
                )}
                <button
                  onClick={() => openCreateIssueDialog(column.id)}
                  className="text-text-faint hover:bg-hover hover:text-text-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add issue
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Issue Dialog */}
      <Dialog open={isCreateIssueOpen} onOpenChange={setIsCreateIssueOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Create Issue</DialogTitle>
            <DialogDescription>
              Add a new issue to {sortedColumns.find((c) => c.id === selectedColumnId)?.name || "the column"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Issue title"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newIssue.title.trim() && selectedColumnId) handleCreateIssue(selectedColumnId);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue…"
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={newIssue.priority} onValueChange={(v) => setNewIssue({ ...newIssue, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGHEST">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="LOWEST">No priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateIssueOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedColumnId && handleCreateIssue(selectedColumnId)}
              disabled={!newIssue.title.trim() || !selectedColumnId || createIssue.isPending}
            >
              {createIssue.isPending ? "Creating…" : "Create Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Column Dialog */}
      <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Create Column</DialogTitle>
            <DialogDescription>Add a new column to the board.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="column-name">Column Name *</Label>
              <Input
                id="column-name"
                placeholder="e.g., In Progress, Blocked"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newColumnName.trim()) handleCreateColumn();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateColumnOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateColumn} disabled={!newColumnName.trim() || createColumn.isPending}>
              {createColumn.isPending ? "Creating…" : "Create Column"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Confirmation */}
      <AlertDialog open={isDeleteColumnOpen} onOpenChange={setIsDeleteColumnOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this column? This action cannot be undone.
              {columnToDelete &&
                getIssuesByColumn(columnToDelete).length > 0 &&
                ` There are ${getIssuesByColumn(columnToDelete).length} issue(s) in this column.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setColumnToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteColumn}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedIssueId !== null && (
        <IssueDetailPanel
          open={selectedIssueId !== null}
          onOpenChange={(open) => !open && setSelectedIssueId(null)}
          orgId={orgId}
          projectId={projectId}
          issueId={selectedIssueId}
        />
      )}
    </div>
  );
}
