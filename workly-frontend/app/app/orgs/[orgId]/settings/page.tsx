"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Palette, Trash2, Check } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { useOrgTheme, themeColors, type OrgThemeColor } from "@/lib/org-theme";
import { useToast } from "@/hooks/use-toast";

const colorOptions: { name: string; value: OrgThemeColor }[] = [
  { name: "Slate", value: "slate" },
  { name: "Zinc", value: "zinc" },
  { name: "Red", value: "red" },
  { name: "Orange", value: "orange" },
  { name: "Amber", value: "amber" },
  { name: "Yellow", value: "yellow" },
  { name: "Lime", value: "lime" },
  { name: "Green", value: "green" },
  { name: "Emerald", value: "emerald" },
  { name: "Teal", value: "teal" },
  { name: "Cyan", value: "cyan" },
  { name: "Sky", value: "sky" },
  { name: "Blue", value: "blue" },
  { name: "Indigo", value: "indigo" },
  { name: "Violet", value: "violet" },
  { name: "Purple", value: "purple" },
  { name: "Fuchsia", value: "fuchsia" },
  { name: "Pink", value: "pink" },
  { name: "Rose", value: "rose" },
];

export default function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const resolvedParams = use(params);
  const orgId = Number(resolvedParams.orgId);
  const router = useRouter();
  const { toast } = useToast();

  const { data: org, isLoading } = useOrganization(orgId);
  const updateOrg = useUpdateOrganization();
  const deleteOrg = useDeleteOrganization();
  const { theme, saveTheme, loadTheme } = useOrgTheme();

  const [name, setName] = useState("");
  const [selectedPrimary, setSelectedPrimary] = useState<OrgThemeColor>("slate");
  const [selectedAccent, setSelectedAccent] = useState<OrgThemeColor>("blue");

  useEffect(() => {
    if (org) {
      setName(org.name);
    }
  }, [org]);

  useEffect(() => {
    loadTheme(orgId);
  }, [orgId, loadTheme]);

  useEffect(() => {
    setSelectedPrimary(theme.primaryColor);
    setSelectedAccent(theme.accentColor);
  }, [theme]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await updateOrg.mutateAsync({ orgId, data: { name } });
  };

  const handleSaveTheme = () => {
    saveTheme(orgId, { primaryColor: selectedPrimary, accentColor: selectedAccent });
    toast({ title: "Theme saved", description: "Organization theme has been updated." });
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

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Organization Theme</CardTitle>
              </div>
              <CardDescription>
                Customize the look and feel for all members. Admin-only setting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Color */}
              <div className="space-y-3">
                <Label>Primary Color</Label>
                <p className="text-xs text-muted-foreground">
                  Used for the sidebar header and organization branding.
                </p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedPrimary(color.value)}
                      className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: themeColors[color.value].primary }}
                      title={color.name}
                    >
                      {selectedPrimary === color.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Accent Color */}
              <div className="space-y-3">
                <Label>Accent Color</Label>
                <p className="text-xs text-muted-foreground">
                  Used for buttons, links, and interactive elements.
                </p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedAccent(color.value)}
                      className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: themeColors[color.value].primary }}
                      title={color.name}
                    >
                      {selectedAccent === color.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-semibold"
                    style={{ backgroundColor: themeColors[selectedPrimary].primary }}
                  >
                    {org?.name?.charAt(0).toUpperCase() || "O"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{org?.name}</p>
                    <p className="text-xs text-muted-foreground">Organization</p>
                  </div>
                  <Button
                    size="sm"
                    style={{ backgroundColor: themeColors[selectedAccent].primary }}
                    className="text-white hover:opacity-90"
                  >
                    Action
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveTheme}>Save Theme</Button>
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
