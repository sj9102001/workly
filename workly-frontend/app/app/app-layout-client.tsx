"use client";

import React from "react"

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { OrgThemeProvider, useOrgTheme } from "@/lib/org-theme";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { loadTheme } = useOrgTheme();
  const orgId = params.orgId ? Number(params.orgId) : null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Load theme when org changes
  useEffect(() => {
    if (orgId) {
      loadTheme(orgId);
    }
  }, [orgId, loadTheme]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleOrgChange = (orgId: number) => {
    router.push(`/app/orgs/${orgId}`);
  };

  const handleCreateOrg = () => {
    router.push("/app/orgs?create=true");
  };

  return (
    <SidebarProvider>
      <AppSidebar onOrgChange={handleOrgChange} onCreateOrg={handleCreateOrg} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <OrgThemeProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </OrgThemeProvider>
  );
}
