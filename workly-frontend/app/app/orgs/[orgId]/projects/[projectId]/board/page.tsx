"use client";

import React, { useState, useCallback } from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreHorizontal, Palette, Settings2 } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { KanbanSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useOrganization,
  useProject,
  useBoards,
  useIssues,
  useCreateIssue,
  useMoveIssue,
  useCreateBoard,
} from "@/hooks/use-queries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQueryClient } from "@tanstack/react-query";

const columns = [
  { id: "TO_DO", title: "To Do", color: "bg-gray-500" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-500" },
  { id: "IN_REVIEW", title: "In Review", color: "bg-purple-500" },
  { id: "DONE", title: "Done", color: "bg-green-500" },
];

const priorityColors: Record<string, string> = {
  HIGHEST: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-500",
  LOWEST: "bg-gray-400",
};

const boardColors = [
  { name: "Gray", value: "gray", class: "bg-gray-500" },
  { name: "Red", value: "red", class: "bg-red-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-500" },
  { name: "Green", value: "green", class: "bg-green-500" },
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
];

type Issue = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  boardId: number | null;
  projectId: number;
  reporterId: number;
  assigneeId: number | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

function KanbanBoardContent({ orgId, projectId }: { orgId: string; projectId: string }) {
  const orgIdNum = Number(orgId);
  const projectIdNum = Number(projectId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const boardIdParam = searchParams.get("boardId");
  const selectedBoardId = boardIdParam ? Number(boardIdParam) : null;

  const { data: org } = useOrganization(orgIdNum);
  const { data: project } = useProject(orgIdNum, projectIdNum);
  const { data: boards } = useBoards(orgIdNum, projectIdNum);
  const { data: issues, isLoading } = useIssues(orgIdNum, projectIdNum, {
    boardId: selectedBoardId || undefined,
  });
  const createIssue = useCreateIssue();
  const moveIssue = useMoveIssue();
  const createBoard = useCreateBoard();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TO_DO",
  });
  const [newBoard, setNewBoard] = useState({ name: "", color: "blue" });
  const [draggingIssue, setDraggingIssue] = useState<Issue | null>(null);

  const handleBoardChange = (boardId: string) => {
    if (boardId === "all") {
      router.push(`/app/orgs/${orgId}/projects/${projectId}/board`);
    } else {
      router.push(`/app/orgs/${orgId}/projects/${projectId}/board?boardId=${boardId}`);
    }
  };

  const handleCreate = async () => {
    if (!newIssue.title.trim()) return;
    await createIssue.mutateAsync({
      orgId: orgIdNum,
      projectId: projectIdNum,
      data: {
        title: newIssue.title,
        description: newIssue.description || undefined,
        priority: newIssue.priority,
        status: newIssue.status,
        boardId: selectedBoardId || undefined,
      },
    });
    setIsCreateOpen(false);
    setNewIssue({ title: "", description: "", priority: "MEDIUM", status: "TO_DO" });
  };

  const handleCreateBoard = async () => {
    if (!newBoard.name.trim()) return;
    await createBoard.mutateAsync({
      orgId: orgIdNum,
      projectId: projectIdNum,
      name: newBoard.name,
    });
    setIsCreateBoardOpen(false);
    setNewBoard({ name: "", color: "blue" });
  };

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    setDraggingIssue(issue);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(issue.id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatus: string, targetIssue?: Issue) => {
      e.preventDefault();

      if (!draggingIssue) return;

      // Optimistic update
      const previousIssues = queryClient.getQueryData<Issue[]>([
        "issues",
        orgIdNum,
        projectIdNum,
        { boardId: selectedBoardId || undefined },
      ]);

      // Update local state optimistically
      queryClient.setQueryData<Issue[]>(
        ["issues", orgIdNum, projectIdNum, { boardId: selectedBoardId || undefined }],
        (old) => {
          if (!old) return old;
          return old.map((issue) =>
            issue.id === draggingIssue.id ? { ...issue, status: targetStatus } : issue
          );
        }
      );

      try {
        const moveData: { status?: string; beforeIssueId?: number; afterIssueId?: number } = {
          status: targetStatus,
        };

        if (targetIssue && targetIssue.id !== draggingIssue.id) {
          moveData.afterIssueId = targetIssue.id;
        }

        await moveIssue.mutateAsync({
          orgId: orgIdNum,
          projectId: projectIdNum,
          issueId: draggingIssue.id,
          data: moveData,
        });
      } catch {
        // Rollback on error
        queryClient.setQueryData(
          ["issues", orgIdNum, projectIdNum, { boardId: selectedBoardId || undefined }],
          previousIssues
        );
        toast({
          title: "Failed to move issue",
          description: "Please try again.",
          variant: "destructive",
        });
      }

      setDraggingIssue(null);
    },
    [draggingIssue, orgIdNum, projectIdNum, selectedBoardId, queryClient, moveIssue, toast]
  );

  const getIssuesByStatus = (status: string) => {
    return issues?.filter((issue) => issue.status === status).sort((a, b) => a.orderIndex - b.orderIndex) || [];
  };

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Projects", href: `/app/orgs/${orgId}/projects` },
          { label: project?.name || "...", href: `/app/orgs/${orgId}/projects/${projectId}` },
          { label: "Board" },
        ]}
      />

      <main className="flex h-[calc(100vh-56px)] flex-col overflow-hidden p-3">
        {/* Header - Fixed to not overflow */}
        <div className="mb-2 flex items-center gap-2">
          <h1 className="shrink-0 text-lg font-semibold">Board</h1>
          <Select value={selectedBoardId ? String(selectedBoardId) : "all"} onValueChange={handleBoardChange}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder="Board" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues</SelectItem>
              {boards?.map((board) => (
                <SelectItem key={board.id} value={String(board.id)}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Actions - Always visible */}
          <Popover open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 bg-transparent text-xs">
                <Palette className="h-3 w-3" />
                <span className="hidden sm:inline">New Board</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Board Name</Label>
                  <Input
                    placeholder="Sprint 1"
                    value={newBoard.name}
                    onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {boardColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewBoard({ ...newBoard, color: color.value })}
                        className={`h-5 w-5 rounded-full transition-all ${color.class} ${
                          newBoard.color === color.value ? "ring-2 ring-offset-2 ring-primary" : "hover:scale-110"
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={handleCreateBoard}
                  disabled={!newBoard.name.trim() || createBoard.isPending}
                >
                  {createBoard.isPending ? "Creating..." : "Create Board"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">Issue</span>
          </Button>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <KanbanSkeleton />
        ) : (
          <div className="flex flex-1 gap-2 overflow-x-auto pb-4">
            {columns.map((column, columnIndex) => {
              const columnIssues = getIssuesByStatus(column.id);
              return (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: columnIndex * 0.05, duration: 0.3 }}
                  className="flex w-56 min-w-[200px] shrink-0 flex-col rounded-lg bg-muted/40"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${column.color}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{column.title}</span>
                    </div>
                    <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                      {columnIssues.length}
                    </Badge>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto px-1.5 pb-2">
                    <AnimatePresence mode="popLayout">
                      {columnIssues.map((issue, index) => (
                        <motion.div
                          key={issue.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                        >
                          <Card
                            draggable
                            onDragStart={(e) => handleDragStart(e, issue)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => {
                              e.stopPropagation();
                              handleDrop(e, column.id, issue);
                            }}
                            className={`group cursor-grab border-0 bg-background shadow-sm transition-all duration-200 hover:shadow-md active:cursor-grabbing active:scale-[0.98] ${
                              draggingIssue?.id === issue.id ? "opacity-50 ring-2 ring-primary" : ""
                            }`}
                          >
                            <CardContent className="p-2">
                              <div className="mb-1 flex items-start justify-between gap-1">
                                <span className="font-mono text-[9px] text-muted-foreground">
                                  #{issue.id}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 focus:opacity-100">
                                      <MoreHorizontal className="h-2.5 w-2.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/app/orgs/${orgId}/projects/${projectId}/issues/${issue.id}`
                                        )
                                      }
                                    >
                                      View Details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <p className="mb-1.5 line-clamp-2 text-[11px] font-medium leading-tight">{issue.title}</p>
                              <div className="flex items-center justify-between">
                                <div
                                  className={`h-1 w-3 rounded-full ${priorityColors[issue.priority]}`}
                                  title={issue.priority}
                                />
                                {issue.assigneeId && (
                                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-medium">
                                    {issue.assigneeId}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Empty column drop area */}
                    {columnIssues.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex h-16 items-center justify-center rounded border border-dashed border-muted-foreground/20 text-[10px] text-muted-foreground"
                      >
                        Drop here
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Issue Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Issue</DialogTitle>
            <DialogDescription>Add a new issue to the board.</DialogDescription>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newIssue.title.trim() || createIssue.isPending}>
              {createIssue.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function KanbanBoardPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const resolvedParams = React.use(params);
  return (
    <Suspense fallback={<KanbanSkeleton />}>
      <KanbanBoardContent orgId={resolvedParams.orgId} projectId={resolvedParams.projectId} />
    </Suspense>
  );
}
