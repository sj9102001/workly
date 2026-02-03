"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Trash2 } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useOrganization, useUpdateOrganization, useDeleteOrganization } from "@/hooks/use-queries";


export default function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const resolvedParams = use(params);
  const orgId = Number(resolvedParams.orgId);
  const router = useRouter();

  const { data: org, isLoading } = useOrganization(orgId);
  const updateOrg = useUpdateOrganization();
  const deleteOrg = useDeleteOrganization();

  const [name, setName] = useState("");

  useEffect(() => {
    if (org) {
      setName(org.name);
    }
  }, [org]);


  const handleSave = async () => {
    if (!name.trim()) return;
    await updateOrg.mutateAsync({ orgId, data: { name } });
  };


  const handleDelete = async () => {
    await deleteOrg.mutateAsync(orgId);
    router.push("/app/orgs");
  };

  if (isLoading) {
    return (
      <>
        <AppTopbar breadcrumbs={[{ label: "Settings" }]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-64 rounded-lg bg-muted" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Settings" },
        ]}
      />

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-2xl space-y-6"
        >
          {/* General Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">General Settings</CardTitle>
              </div>
              <CardDescription>Manage your organization details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Organization"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={org?.slug || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  The slug is auto-generated and cannot be changed.
                </p>
              </div>
              <Button onClick={handleSave} disabled={updateOrg.isPending || !name.trim()}>
                {updateOrg.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>


          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Organization</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the organization
                      <strong> {org?.name}</strong> and all its projects, boards, and issues.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteOrg.isPending ? "Deleting..." : "Delete Organization"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  );
}
