"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreHorizontal, X, GripVertical, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";

const priorityColors: Record<string, string> = {
  HIGHEST: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-500",
  LOWEST: "bg-gray-400",
};

type Issue = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  columnId: number;
  projectId: number;
  reporterId: number;
  assigneeId: number | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

type Column = {
  id: number;
  boardId: number;
  name: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

interface KanbanBoardProps {
  orgId: number;
  projectId: number;
}

export function KanbanBoard({ orgId, projectId }: KanbanBoardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: columns = [], isLoading: columnsLoading } = useColumns(orgId, projectId);
  const { data: allIssues = [], isLoading: issuesLoading } = useIssues(orgId, projectId);
  const createIssue = useCreateIssue();
  const moveIssue = useMoveIssue();
  const createColumn = useCreateColumn();
  const deleteColumn = useDeleteColumn();

  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [isDeleteColumnOpen, setIsDeleteColumnOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<number | null>(null);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  });
  const [newColumnName, setNewColumnName] = useState("");
  const [draggingIssue, setDraggingIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sort columns by orderIndex
  const sortedColumns = [...columns].sort((a, b) => a.orderIndex - b.orderIndex);

  // Get issues for a specific column, sorted by orderIndex
  const getIssuesByColumn = (columnId: number) => {
    return allIssues
      .filter((issue) => issue.columnId === columnId)
      .filter((issue) => 
        searchQuery === "" || 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const handleCreateIssue = async (columnId: number) => {
    if (!newIssue.title.trim()) return;
    try {
      await createIssue.mutateAsync({
        orgId,
        projectId,
        data: {
          title: newIssue.title,
          description: newIssue.description || undefined,
          priority: newIssue.priority,
          columnId: columnId,
        },
      });
      setIsCreateIssueOpen(false);
      setNewIssue({ title: "", description: "", priority: "MEDIUM" });
      setSelectedColumnId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      await createColumn.mutateAsync({
        orgId,
        projectId,
        name: newColumnName.trim(),
      });
      setIsCreateColumnOpen(false);
      setNewColumnName("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteColumn = async () => {
    if (!columnToDelete) return;
    try {
      await deleteColumn.mutateAsync({
        orgId,
        projectId,
        columnId: columnToDelete,
      });
      setIsDeleteColumnOpen(false);
      setColumnToDelete(null);
    } catch (error) {
      // Error handled by mutation
    }
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
    async (e: React.DragEvent, targetColumnId: number, targetIssue?: Issue) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggingIssue || draggingIssue.columnId === targetColumnId) {
        setDraggingIssue(null);
        return;
      }

      // Optimistic update
      const previousIssues = queryClient.getQueryData<Issue[]>([
        "issues",
        orgId,
        projectId,
      ]);

      queryClient.setQueryData<Issue[]>(
        ["issues", orgId, projectId],
        (old) => {
          if (!old) return old;
          return old.map((issue) =>
            issue.id === draggingIssue.id
              ? { ...issue, columnId: targetColumnId }
              : issue
          );
        }
      );

      try {
        const moveData: { columnId: number; beforeIssueId?: number; afterIssueId?: number } = {
          columnId: targetColumnId,
        };

        if (targetIssue && targetIssue.id !== draggingIssue.id) {
          moveData.afterIssueId = targetIssue.id;
        }

        await moveIssue.mutateAsync({
          orgId,
          projectId,
          issueId: draggingIssue.id,
          data: moveData,
        });
      } catch (error) {
        // Rollback on error
        queryClient.setQueryData(
          ["issues", orgId, projectId],
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
    [draggingIssue, orgId, projectId, queryClient, moveIssue, toast]
  );

  const openCreateIssueDialog = (columnId: number) => {
    setSelectedColumnId(columnId);
    setIsCreateIssueOpen(true);
  };

  if (columnsLoading || issuesLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1" />
          <div className="relative flex items-center gap-2">
            <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-64 pl-8 text-sm"
            />
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setIsCreateColumnOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Column</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {sortedColumns.map((column, columnIndex) => {
          const columnIssues = getIssuesByColumn(column.id);
          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columnIndex * 0.05, duration: 0.3 }}
              className="flex w-72 min-w-[280px] shrink-0 flex-col rounded-lg bg-background shadow-sm"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">{column.name}</h3>
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {columnIssues.length}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => openCreateIssueDialog(column.id)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Issue
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setColumnToDelete(column.id);
                        setIsDeleteColumnOpen(true);
                      }}
                      className="text-destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Delete Column
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Issues */}
              <div className="flex-1 space-y-2 overflow-y-auto p-2">
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
                        className={`group cursor-grab border bg-background shadow-sm transition-all hover:shadow-md active:cursor-grabbing active:scale-[0.98] ${
                          draggingIssue?.id === issue.id
                            ? "opacity-50 ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() =>
                          router.push(
                            `/app/orgs/${orgId}/projects/${projectId}/issues/${issue.id}`
                          )
                        }
                      >
                        <CardContent className="p-3">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-medium leading-tight">
                              {issue.title}
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/app/orgs/${orgId}/projects/${projectId}/issues/${issue.id}`
                                    );
                                  }}
                                >
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center justify-between">
                            <div
                              className={`h-2 w-2 rounded-full ${priorityColors[issue.priority] || "bg-gray-400"}`}
                              title={issue.priority}
                            />
                            {issue.assigneeId && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                {String(issue.assigneeId).slice(-2)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Create Issue Button */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => openCreateIssueDialog(column.id)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Create Issue</span>
                </Button>

                {/* Empty state */}
                {columnIssues.length === 0 && (
                  <div className="flex h-20 items-center justify-center rounded border border-dashed border-muted-foreground/20 text-xs text-muted-foreground">
                    {searchQuery ? "No matching issues" : "No issues"}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

      </div>

      {/* Create Issue Dialog */}
      <Dialog open={isCreateIssueOpen} onOpenChange={setIsCreateIssueOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Issue</DialogTitle>
            <DialogDescription>
              Add a new issue to{" "}
              {sortedColumns.find((c) => c.id === selectedColumnId)?.name || "the column"}.
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
                  if (e.key === "Enter" && newIssue.title.trim() && selectedColumnId) {
                    handleCreateIssue(selectedColumnId);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue..."
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                rows={4}
              />
            </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateIssueOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedColumnId && handleCreateIssue(selectedColumnId)}
              disabled={!newIssue.title.trim() || !selectedColumnId || createIssue.isPending}
            >
              {createIssue.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Column Dialog */}
      <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Column</DialogTitle>
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
                  if (e.key === "Enter" && newColumnName.trim()) {
                    handleCreateColumn();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateColumnOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateColumn}
              disabled={!newColumnName.trim() || createColumn.isPending}
            >
              {createColumn.isPending ? "Creating..." : "Create Column"}
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
            <AlertDialogCancel onClick={() => setColumnToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteColumn}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
