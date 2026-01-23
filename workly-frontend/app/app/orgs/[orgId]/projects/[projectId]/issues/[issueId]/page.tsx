"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { PageSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useOrganization,
  useProject,
  useBoards,
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
  const { data: boards } = useBoards(orgIdNum, projectIdNum);
  const { data: issue, isLoading } = useIssue(orgIdNum, projectIdNum, issueIdNum);
  const updateIssue = useUpdateIssue();
  const moveIssue = useMoveIssue();

  const [editedIssue, setEditedIssue] = useState<{
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    boardId?: string;
  }>({});

  const hasChanges = Object.keys(editedIssue).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;

    const updateData: Record<string, unknown> = {};
    if (editedIssue.title !== undefined) updateData.title = editedIssue.title;
    if (editedIssue.description !== undefined) updateData.description = editedIssue.description;
    if (editedIssue.priority !== undefined) updateData.priority = editedIssue.priority;

    // Status and board changes go through the move endpoint
    if (editedIssue.status !== undefined || editedIssue.boardId !== undefined) {
      await moveIssue.mutateAsync({
        orgId: orgIdNum,
        projectId: projectIdNum,
        issueId: issueIdNum,
        data: {
          status: editedIssue.status,
          boardId: editedIssue.boardId ? Number(editedIssue.boardId) : undefined,
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
  const currentBoardId = editedIssue.boardId ?? (issue.boardId ? String(issue.boardId) : "");

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

      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/app/orgs/${orgId}/projects/${projectId}/issues`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Issues
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} disabled={updateIssue.isPending || moveIssue.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateIssue.isPending || moveIssue.isPending ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">#{issue.id}</span>
                  <Badge className={priorityColors[currentPriority]}>{currentPriority}</Badge>
                  <Badge className={statusColors[currentStatus]}>
                    {currentStatus.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={currentTitle}
                    onChange={(e) => setEditedIssue({ ...editedIssue, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={6}
                    value={currentDescription}
                    onChange={(e) => setEditedIssue({ ...editedIssue, description: e.target.value })}
                    placeholder="Add a description..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={currentStatus}
                    onValueChange={(v) => setEditedIssue({ ...editedIssue, status: v })}
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

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={currentPriority}
                    onValueChange={(v) => setEditedIssue({ ...editedIssue, priority: v })}
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
                  <Label>Board</Label>
                  <Select
                    value={currentBoardId}
                    onValueChange={(v) => setEditedIssue({ ...editedIssue, boardId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Backlog" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Backlog (No Board)</SelectItem>
                      {boards?.map((board) => (
                        <SelectItem key={board.id} value={String(board.id)}>
                          {board.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reporter</span>
                  <span>User #{issue.reporterId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assignee</span>
                  <span>{issue.assigneeId ? `User #${issue.assigneeId}` : "Unassigned"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(issue.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
