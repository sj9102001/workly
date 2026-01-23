"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, List, Users, Settings, CheckSquare, Trash2 } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { PageSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useOrganization,
  useProject,
  useBoards,
  useIssues,
  useProjectMembers,
  useCreateBoard,
  useDeleteProject,
} from "@/hooks/use-queries";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = use(params);
  const orgIdNum = Number(orgId);
  const projectIdNum = Number(projectId);
  const router = useRouter();

  const { data: org } = useOrganization(orgIdNum);
  const { data: project, isLoading } = useProject(orgIdNum, projectIdNum);
  const { data: boards } = useBoards(orgIdNum, projectIdNum);
  const { data: issues } = useIssues(orgIdNum, projectIdNum);
  const { data: members } = useProjectMembers(orgIdNum, projectIdNum);
  const createBoard = useCreateBoard();
  const deleteProject = useDeleteProject();

  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;
    await createBoard.mutateAsync({ orgId: orgIdNum, projectId: projectIdNum, name: boardName });
    setIsCreateBoardOpen(false);
    setBoardName("");
  };

  const handleDeleteProject = async () => {
    await deleteProject.mutateAsync({ orgId: orgIdNum, projectId: projectIdNum });
    router.push(`/app/orgs/${orgId}/projects`);
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

  if (!project) {
    return (
      <>
        <AppTopbar breadcrumbs={[{ label: "Not Found" }]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Project not found</h1>
            <Button className="mt-4" onClick={() => router.push(`/app/orgs/${orgId}/projects`)}>
              Go to Projects
            </Button>
          </div>
        </main>
      </>
    );
  }

  const issuesByStatus = {
    TO_DO: issues?.filter((i) => i.status === "TO_DO").length || 0,
    IN_PROGRESS: issues?.filter((i) => i.status === "IN_PROGRESS").length || 0,
    IN_REVIEW: issues?.filter((i) => i.status === "IN_REVIEW").length || 0,
    DONE: issues?.filter((i) => i.status === "DONE").length || 0,
  };

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Projects", href: `/app/orgs/${orgId}/projects` },
          { label: project.name },
        ]}
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="bg-transparent">
              <Link href={`/app/orgs/${orgId}/projects/${projectId}/issues`}>
                <List className="mr-2 h-4 w-4" />
                Issues
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/app/orgs/${orgId}/projects/${projectId}/board`}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Board
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{issuesByStatus.TO_DO}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{issuesByStatus.IN_PROGRESS}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{issuesByStatus.IN_REVIEW}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Done</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{issuesByStatus.DONE}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="boards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="boards">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Boards
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boards" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Boards</h2>
              <Button size="sm" onClick={() => setIsCreateBoardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Board
              </Button>
            </div>
            {boards?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <LayoutGrid className="mb-4 h-8 w-8 text-muted-foreground" />
                  <h3 className="mb-2 font-medium">No boards yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Create a board to organize your issues into columns.
                  </p>
                  <Button size="sm" onClick={() => setIsCreateBoardOpen(true)}>
                    Create Board
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {boards?.map((board) => (
                  <Card
                    key={board.id}
                    className="cursor-pointer transition-colors hover:border-foreground/20"
                    onClick={() =>
                      router.push(`/app/orgs/${orgId}/projects/${projectId}/board?boardId=${board.id}`)
                    }
                  >
                    <CardHeader>
                      <CardTitle className="text-base">{board.name}</CardTitle>
                      <CardDescription>
                        Created {new Date(board.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <h2 className="text-lg font-medium">Project Members</h2>
            {members?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members assigned to this project yet.</p>
            ) : (
              <div className="rounded-md border border-border">
                {members?.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between border-b border-border p-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{member.userName}</p>
                      <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{member.role}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete this project</p>
                    <p className="text-sm text-muted-foreground">
                      Once deleted, all boards and issues will be permanently removed.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Board Dialog */}
      <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Board</DialogTitle>
            <DialogDescription>Add a new board to organize your issues.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="boardName">Board Name</Label>
              <Input
                id="boardName"
                placeholder="Sprint 1"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBoardOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={!boardName.trim() || createBoard.isPending}>
              {createBoard.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All boards and issues in this project will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProject.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
