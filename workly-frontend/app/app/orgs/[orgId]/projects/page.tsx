"use client";

import { use, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, FolderKanban, Calendar, ArrowRight } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { NoProjects } from "@/components/app-shell/empty-states";
import { CardSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useOrganization, useProjects, useCreateProject } from "@/hooks/use-queries";

function ProjectsPageContent({ orgId }: { orgId: string }) {
  const orgIdNum = Number(orgId);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: org } = useOrganization(orgIdNum);
  const { data: projects, isLoading } = useProjects(orgIdNum);
  const createProject = useCreateProject();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const handleCreate = async () => {
    if (!projectName.trim()) return;
    const result = await createProject.mutateAsync({ orgId: orgIdNum, name: projectName });
    setIsCreateOpen(false);
    setProjectName("");
    router.push(`/app/orgs/${orgId}/projects/${result.id}`);
  };

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Projects" },
        ]}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">Manage projects in this organization</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <NoProjects onCreateProject={() => setIsCreateOpen(true)} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-colors hover:border-foreground/20"
                onClick={() => router.push(`/app/orgs/${orgId}/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <FolderKanban className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <CardDescription className="text-xs">Project</CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Add a new project to organize your work.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="Website Redesign"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!projectName.trim() || createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ProjectsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ProjectsPageContent orgId={orgId} />
    </Suspense>
  );
}

// loading.tsx
// export default function Loading() {
//   return null;
// }
