"use client";

import { useState } from "react";
import {
  Save,
  Plus,
  MoreHorizontal,
  Link2,
  ChevronDown,
  Flag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useOrganization,
  useProject,
  useColumns,
  useIssue,
  useUpdateIssue,
  useMoveIssue,
} from "@/hooks/use-queries";
import { Skeleton } from "@/components/ui/skeleton";

const priorityColors: Record<string, string> = {
  HIGHEST: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-blue-500 text-white",
  LOWEST: "bg-gray-400 text-white",
};

interface IssueDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: number;
  projectId: number;
  issueId: number;
}

export function IssueDetailModal({
  open,
  onOpenChange,
  orgId,
  projectId,
  issueId,
}: IssueDetailModalProps) {
  const { data: org } = useOrganization(open ? orgId : null);
  const { data: project } = useProject(open ? orgId : null, projectId);
  const { data: columns } = useColumns(open ? orgId : null, open ? projectId : null);
  const { data: issue, isLoading } = useIssue(
    open ? orgId : null,
    open ? projectId : null,
    open ? issueId : null
  );
  const updateIssue = useUpdateIssue();
  const moveIssue = useMoveIssue();

  const [editedIssue, setEditedIssue] = useState<{
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    columnId?: string;
  }>({});

  const hasChanges = Object.keys(editedIssue).length > 0;

  const handleSave = async () => {
    if (!hasChanges || !issue) return;

    const updateData: Record<string, unknown> = {};
    if (editedIssue.title !== undefined) updateData.title = editedIssue.title;
    if (editedIssue.description !== undefined) updateData.description = editedIssue.description;
    if (editedIssue.priority !== undefined) updateData.priority = editedIssue.priority;

    if (editedIssue.status !== undefined || editedIssue.columnId !== undefined) {
      const targetColumnId = editedIssue.columnId
        ? Number(editedIssue.columnId)
        : issue.columnId;
      await moveIssue.mutateAsync({
        orgId,
        projectId,
        issueId,
        data: { status: editedIssue.status, columnId: targetColumnId! },
      });
    }

    if (Object.keys(updateData).length > 0) {
      await updateIssue.mutateAsync({
        orgId,
        projectId,
        issueId,
        data: updateData as { title?: string; description?: string; priority?: string },
      });
    }
    setEditedIssue({});
  };

  const currentTitle = editedIssue.title ?? issue?.title ?? "";
  const currentDescription = editedIssue.description ?? issue?.description ?? "";
  const currentPriority = editedIssue.priority ?? issue?.priority ?? "MEDIUM";
  const currentStatus = editedIssue.status ?? issue?.status ?? "TO_DO";
  const currentColumnId = editedIssue.columnId ?? (issue?.columnId ? String(issue.columnId) : "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[96vw] w-full h-[94vh] max-h-[94vh] overflow-hidden flex flex-col p-0 gap-0"
      >
        <div className="flex items-center justify-between border-b px-6 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                #{issueId}
              </span>
              {issue && (
                <Badge className={priorityColors[currentPriority]} variant="secondary">
                  <Flag className="mr-1 h-3 w-3" />
                  {currentPriority}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                onClick={handleSave}
                disabled={updateIssue.isPending || moveIssue.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateIssue.isPending || moveIssue.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Clone</DropdownMenuItem>
                <DropdownMenuItem>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !issue ? (
            <div className="p-6 text-center text-muted-foreground">
              Issue not found.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3 p-6">
              <div className="space-y-6 lg:col-span-2">
                <div className="space-y-4">
                  <Select
                    value={currentStatus}
                    onValueChange={(v) => setEditedIssue({ ...editedIssue, status: v })}
                  >
                    <SelectTrigger className="w-auto border-none p-0 h-auto font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TO_DO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="IN_REVIEW">In Review</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={currentTitle}
                    onChange={(e) => setEditedIssue({ ...editedIssue, title: e.target.value })}
                    className="text-2xl font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                    placeholder="Issue title"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Description</h3>
                  <Textarea
                    value={currentDescription}
                    onChange={(e) => setEditedIssue({ ...editedIssue, description: e.target.value })}
                    placeholder="Add a description..."
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Subtasks</h3>
                    <Button variant="ghost" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add subtask
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No subtasks yet. Break down this issue into smaller tasks.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Linked work items</h3>
                    <Button variant="ghost" size="sm">
                      <Link2 className="mr-2 h-4 w-4" />
                      Add linked work item
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No linked work items yet.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Activity</h3>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                      <TabsTrigger value="worklog">Work log</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="space-y-4 mt-4">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>SJ</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Add a comment..."
                            className="min-h-[80px] resize-none"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            Pro tip: press M to comment
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="comments" className="mt-4">
                      <p className="text-sm text-muted-foreground">No comments yet.</p>
                    </TabsContent>
                    <TabsContent value="history" className="mt-4">
                      <p className="text-sm text-muted-foreground">No history yet.</p>
                    </TabsContent>
                    <TabsContent value="worklog" className="mt-4">
                      <p className="text-sm text-muted-foreground">No work logged yet.</p>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Assignee</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {issue.assigneeId ? "U" : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {issue.assigneeId ? `User #${issue.assigneeId}` : "Unassigned"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Priority</span>
                      <Select
                        value={currentPriority}
                        onValueChange={(v) => setEditedIssue({ ...editedIssue, priority: v })}
                      >
                        <SelectTrigger className="w-auto border-none p-0 h-auto">
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reporter</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">SJ</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">User #{issue.reporterId}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm">Column</Label>
                  <Select
                    value={currentColumnId}
                    onValueChange={(v) => setEditedIssue({ ...editedIssue, columnId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
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
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>Created {new Date(issue.createdAt).toLocaleDateString()}</div>
                  <div>Updated {new Date(issue.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
