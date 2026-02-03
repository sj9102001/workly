"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Calendar, 
  Plus, 
  MoreHorizontal,
  MessageSquare,
  History,
  Clock,
  Link2,
  ChevronDown,
  Flag
} from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { PageSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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

const priorityColors: Record<string, string> = {
  HIGHEST: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-blue-500 text-white",
  LOWEST: "bg-gray-400 text-white",
};

const statusColors: Record<string, string> = {
  TO_DO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
};

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string; issueId: string }>;
}) {
  const { orgId, projectId, issueId } = use(params);
  const orgIdNum = Number(orgId);
  const projectIdNum = Number(projectId);
  const issueIdNum = Number(issueId);
  const router = useRouter();

  const { data: org } = useOrganization(orgIdNum);
  const { data: project } = useProject(orgIdNum, projectIdNum);
  const { data: columns } = useColumns(orgIdNum, projectIdNum);
  const { data: issue, isLoading } = useIssue(orgIdNum, projectIdNum, issueIdNum);
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
    if (!hasChanges) return;

    const updateData: Record<string, unknown> = {};
    if (editedIssue.title !== undefined) updateData.title = editedIssue.title;
    if (editedIssue.description !== undefined) updateData.description = editedIssue.description;
    if (editedIssue.priority !== undefined) updateData.priority = editedIssue.priority;

    // Status and column changes go through the move endpoint
    if (editedIssue.status !== undefined || editedIssue.columnId !== undefined) {
      const targetColumnId = editedIssue.columnId 
        ? Number(editedIssue.columnId) 
        : issue?.columnId;

      await moveIssue.mutateAsync({
        orgId: orgIdNum,
        projectId: projectIdNum,
        issueId: issueIdNum,
        data: {
          status: editedIssue.status,
          columnId: targetColumnId!,
        },
      });
    }

    if (Object.keys(updateData).length > 0) {
      await updateIssue.mutateAsync({
        orgId: orgIdNum,
        projectId: projectIdNum,
        issueId: issueIdNum,
        data: updateData as { title?: string; description?: string; priority?: string },
      });
    }

    setEditedIssue({});
  };

  if (isLoading) {
    return (
      <>
        <AppTopbar breadcrumbs={[{ label: "Loading..." }]} />
        <main className="flex-1 overflow-auto p-6">
          <PageSkeleton />
        </main>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <AppTopbar breadcrumbs={[{ label: "Not Found" }]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Issue not found</h1>
            <Button
              className="mt-4"
              onClick={() => router.push(`/app/orgs/${orgId}/projects/${projectId}/issues`)}
            >
              Go to Issues
            </Button>
          </div>
        </main>
      </>
    );
  }

  const currentTitle = editedIssue.title ?? issue.title;
  const currentDescription = editedIssue.description ?? issue.description ?? "";
  const currentPriority = editedIssue.priority ?? issue.priority;
  const currentStatus = editedIssue.status ?? issue.status;
  const currentColumnId = editedIssue.columnId ?? (issue.columnId ? String(issue.columnId) : "");

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Projects", href: `/app/orgs/${orgId}/projects` },
          { label: project?.name || "...", href: `/app/orgs/${orgId}/projects/${projectId}` },
          { label: "Issues", href: `/app/orgs/${orgId}/projects/${projectId}/issues` },
          { label: `#${issue.id}` },
        ]}
      />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/app/orgs/${orgId}/projects/${projectId}/issues`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Issues
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">#{issue.id}</span>
                <Badge className={priorityColors[currentPriority]} variant="secondary">
                  <Flag className="mr-1 h-3 w-3" />
                  {currentPriority}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button onClick={handleSave} disabled={updateIssue.isPending || moveIssue.isPending}>
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
        </div>

        <div className="grid gap-6 lg:grid-cols-3 p-6">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Issue Title */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Select value={currentStatus} onValueChange={(v) => setEditedIssue({ ...editedIssue, status: v })}>
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
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                value={currentTitle}
                onChange={(e) => setEditedIssue({ ...editedIssue, title: e.target.value })}
                className="text-2xl font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                placeholder="Issue title"
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Description</h3>
              <Textarea
                value={currentDescription}
                onChange={(e) => setEditedIssue({ ...editedIssue, description: e.target.value })}
                placeholder="Add a description..."
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Subtasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Subtasks</h3>
                <Button variant="ghost" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add subtask
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                No subtasks yet. Break down this issue into smaller tasks.
              </div>
            </div>

            {/* Linked work items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Linked work items</h3>
                <Button variant="ghost" size="sm">
                  <Link2 className="mr-2 h-4 w-4" />
                  Add linked work item
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                No linked work items yet.
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Activity</h3>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="worklog">Work log</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-4">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a comment..."
                        className="min-h-[80px] resize-none"
                      />
                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            Who is working on this...?
                          </Button>
                          <Button variant="ghost" size="sm">
                            Status update...
                          </Button>
                          <Button variant="ghost" size="sm">
                            Thanks...
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Pro tip: press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">M</kbd> to comment
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="comments">
                  <div className="text-sm text-muted-foreground">No comments yet.</div>
                </TabsContent>
                <TabsContent value="history">
                  <div className="text-sm text-muted-foreground">No history yet.</div>
                </TabsContent>
                <TabsContent value="worklog">
                  <div className="text-sm text-muted-foreground">No work logged yet.</div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar - Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">Details</h3>
              <div className="space-y-4">
                {/* Assignee */}
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

                {/* Priority */}
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

                {/* Labels */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Labels</span>
                  <span className="text-sm">None</span>
                </div>

                {/* Team */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Team</span>
                  <span className="text-sm">None</span>
                </div>

                {/* Due date */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Due date</span>
                  <span className="text-sm">None</span>
                </div>

                {/* Start date */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Start date</span>
                  <span className="text-sm">None</span>
                </div>

                {/* Reporter */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reporter</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">SJ</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">sagar jaswal</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Development */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-medium">Development</h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">
                No development work has been linked to this issue yet.
              </div>
            </div>

            <Separator />

            {/* Automation */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Automation</h3>
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs">⚡</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Rule executions</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Separator />

            {/* Column */}
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

            {/* Timestamps */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>Created {new Date(issue.createdAt).toLocaleDateString()}</div>
              <div>Updated {new Date(issue.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
