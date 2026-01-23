"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Building2, Trash2, Palette, Check } from "lucide-react";

// Theme colors - matching the org-theme system
const themeColors: Record<string, { primary: string; light: string }> = {
  slate: { primary: "#475569", light: "#94a3b8" },
  zinc: { primary: "#52525b", light: "#a1a1aa" },
  red: { primary: "#dc2626", light: "#f87171" },
  orange: { primary: "#ea580c", light: "#fb923c" },
  amber: { primary: "#d97706", light: "#fbbf24" },
  yellow: { primary: "#ca8a04", light: "#facc15" },
  lime: { primary: "#65a30d", light: "#a3e635" },
  green: { primary: "#16a34a", light: "#4ade80" },
  emerald: { primary: "#059669", light: "#34d399" },
  teal: { primary: "#0d9488", light: "#2dd4bf" },
  cyan: { primary: "#0891b2", light: "#22d3ee" },
  sky: { primary: "#0284c7", light: "#38bdf8" },
  blue: { primary: "#2563eb", light: "#60a5fa" },
  indigo: { primary: "#4f46e5", light: "#818cf8" },
  violet: { primary: "#7c3aed", light: "#a78bfa" },
  purple: { primary: "#9333ea", light: "#c084fc" },
  fuchsia: { primary: "#c026d3", light: "#e879f9" },
  pink: { primary: "#db2777", light: "#f472b6" },
  rose: { primary: "#e11d48", light: "#fb7185" },
};

const colorOptions = [
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

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("Acme Corp");
  const [orgSlug, setOrgSlug] = useState("acme");
  const [orgDescription, setOrgDescription] = useState(
    "Building the future of project management"
  );
  const [selectedPrimary, setSelectedPrimary] = useState("slate");
  const [selectedAccent, setSelectedAccent] = useState("blue");
  const [themeSaved, setThemeSaved] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("org-theme-demo");
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        setSelectedPrimary(theme.primaryColor || "slate");
        setSelectedAccent(theme.accentColor || "blue");
      } catch {}
    }
  }, []);

  const handleSaveTheme = () => {
    localStorage.setItem("org-theme-demo", JSON.stringify({
      primaryColor: selectedPrimary,
      accentColor: selectedAccent,
    }));
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>
                Update your organization&apos;s information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary text-primary-foreground text-2xl font-bold">
                  {orgName.charAt(0)}
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    Change logo
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG or SVG. Max 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Organization name</Label>
                  <Input
                    id="name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slug">Organization URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      workly.app/
                    </span>
                    <Input
                      id="slug"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      className="max-w-[200px]"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Information about your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <div className="flex items-center gap-2">
                    <Badge>Free</Badge>
                    <span className="text-sm">Self-hosted</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">January 15, 2024</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="text-sm">5 members</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="text-sm">6 projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Organization Theme</CardTitle>
              </div>
              <CardDescription>
                Customize the look and feel for all organization members. Admin-only setting.
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

              <Separator />

              {/* Preview */}
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-semibold"
                    style={{ backgroundColor: themeColors[selectedPrimary].primary }}
                  >
                    {orgName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{orgName}</p>
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

              <Button onClick={handleSaveTheme}>
                {themeSaved ? "Saved!" : "Save Theme"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that can affect your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg">
                <div>
                  <p className="font-medium">Delete organization</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this organization and all its data.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the organization &quot;{orgName}&quot; and all
                        associated data including projects, tasks, and member
                        access.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Organization
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
