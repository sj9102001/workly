"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, List, Users, Settings, Trash2, BarChart3, UserMinus } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { PageSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/kanban-board";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import {
  useOrganization,
  useProject,
  useIssues,
  useProjectMembers,
  useOrgMembers,
  useAddProjectMember,
  useRemoveProjectMember,
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

  const { userId: currentUserId } = useAuth();
  const { data: org } = useOrganization(orgIdNum);
  const { data: project, isLoading } = useProject(orgIdNum, projectIdNum);
  const { data: issues } = useIssues(orgIdNum, projectIdNum);
  const { data: members } = useProjectMembers(orgIdNum, projectIdNum);
  const { data: orgMembers } = useOrgMembers(orgIdNum);
  const addProjectMember = useAddProjectMember();
  const removeProjectMember = useRemoveProjectMember();
  const deleteProject = useDeleteProject();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState<string>("");
  const [addMemberRole, setAddMemberRole] = useState<string>("MEMBER");
  const [removeMemberUserId, setRemoveMemberUserId] = useState<number | null>(null);

  const currentUserProjectRole = members?.find((m) => m.userId === currentUserId)?.role;
  const canManageMembers =
    currentUserProjectRole === "ADMIN" || currentUserProjectRole === "OWNER";

  const projectMemberUserIds = new Set(members?.map((m) => m.userId) ?? []);
  const orgMembersNotInProject = orgMembers?.filter(
    (om) => !projectMemberUserIds.has(om.userId)
  ) ?? [];

  const handleDeleteProject = async () => {
    await deleteProject.mutateAsync({ orgId: orgIdNum, projectId: projectIdNum });
    router.push(`/app/orgs/${orgId}/projects`);
  };

  const handleAddMember = async () => {
    if (!addMemberUserId || addMemberUserId === "__none__") return;
    await addProjectMember.mutateAsync({
      orgId: orgIdNum,
      projectId: projectIdNum,
      userId: Number(addMemberUserId),
      role: addMemberRole,
    });
    setAddMemberOpen(false);
    setAddMemberUserId("");
    setAddMemberRole("MEMBER");
  };

  const handleRemoveMember = async () => {
    if (removeMemberUserId === null) return;
    await removeProjectMember.mutateAsync({
      orgId: orgIdNum,
      projectId: projectIdNum,
      userId: removeMemberUserId,
    });
    setRemoveMemberUserId(null);
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

      <main className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-background px-6 py-4">
          <div className="flex items-start justify-between">
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
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="flex h-full flex-col overflow-hidden">
          <div className="border-b bg-background px-6">
            <TabsList variant="line" className="h-auto bg-transparent">
              <TabsTrigger value="summary" className="px-4 py-3 cursor-pointer hover:scale-105">
                <BarChart3 className="mr-2 h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="board" className="px-4 py-3 cursor-pointer hover:scale-105">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="members" className="px-4 py-3 cursor-pointer hover:scale-105">
                <Users className="mr-2 h-4 w-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="settings" className="px-4 py-3 cursor-pointer hover:scale-105">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="summary" className="m-0 h-full space-y-6 p-6">
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
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
            </TabsContent>

            <TabsContent value="board" className="m-0 h-full p-0">
              <div className="h-full">
                <KanbanBoard orgId={orgIdNum} projectId={projectIdNum} />
              </div>
            </TabsContent>

            <TabsContent value="members" className="m-0 h-full space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Project Members</h2>
                {canManageMembers && (
                  <Button onClick={() => setAddMemberOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add member
                  </Button>
                )}
              </div>
              {members?.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No members assigned to this project yet.
                  {canManageMembers && " Add members from your organization."}
                </p>
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
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{member.role}</span>
                        {canManageMembers && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRemoveMemberUserId(member.userId)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="m-0 h-full space-y-6 p-6">
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
                      Once deleted, all issues will be permanently removed.
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
          </div>
        </Tabs>
      </main>


      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member to project</DialogTitle>
            <DialogDescription>
              Add an organization member to this project. Only org members not already in the project are listed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {orgMembersNotInProject.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No org members available to add
                    </SelectItem>
                  ) : (
                    orgMembersNotInProject.map((om) => (
                      <SelectItem key={om.userId} value={String(om.userId)}>
                        {om.userName} ({om.userEmail})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={addMemberRole} onValueChange={setAddMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!addMemberUserId || addMemberUserId === "__none__" || addProjectMember.isPending}
            >
              {addProjectMember.isPending ? "Adding..." : "Add member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={removeMemberUserId !== null} onOpenChange={() => setRemoveMemberUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member from project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the member from the project. They will no longer have access to project boards and issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeProjectMember.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All issues in this project will be permanently deleted.
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
