"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Building2, Calendar } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { NoOrganizations } from "@/components/app-shell/empty-states";
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
import { useOrganizations, useCreateOrganization } from "@/hooks/use-queries";
import Loading from "./loading"; // Import the loading component

function OrgsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: organizations, isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const handleCreate = async () => {
    if (!newOrgName.trim()) return;
    const result = await createOrg.mutateAsync(newOrgName);
    setIsCreateOpen(false);
    setNewOrgName("");
    router.push(`/app/orgs/${result.id}`);
  };

  const slugPreview = newOrgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <>
      <AppTopbar breadcrumbs={[{ label: "Organizations" }]} />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
            <p className="text-sm text-muted-foreground">Manage your organizations and teams</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : organizations?.length === 0 ? (
          <NoOrganizations onCreateOrg={() => setIsCreateOpen(true)} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations?.map((org) => (
              <Card
                key={org.id}
                className="cursor-pointer transition-colors hover:border-foreground/20"
                onClick={() => router.push(`/app/orgs/${org.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{org.name}</CardTitle>
                      <CardDescription className="text-xs">/{org.slug}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
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
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Add a new organization to manage your projects and team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Acme Inc"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
            </div>
            {slugPreview && (
              <p className="text-sm text-muted-foreground">
                Slug: <span className="font-mono text-foreground">/{slugPreview}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newOrgName.trim() || createOrg.isPending}>
              {createOrg.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function OrgsPage() {
  return (
    <Suspense fallback={<Loading />}> {/* Use the loading component */}
      <OrgsPageContent />
    </Suspense>
  );
}
