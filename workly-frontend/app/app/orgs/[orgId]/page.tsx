"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Users, FolderKanban, Mail, ArrowRight, Building2 } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { PageSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrganization, useProjects, useOrgMembers, useInvites } from "@/hooks/use-queries";

export default function OrgDashboardPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const orgIdNum = Number(orgId);
  const router = useRouter();

  const { data: org, isLoading: orgLoading } = useOrganization(orgIdNum);
  const { data: projects, isLoading: projectsLoading } = useProjects(orgIdNum);
  const { data: members, isLoading: membersLoading } = useOrgMembers(orgIdNum);
  const { data: invites, isLoading: invitesLoading } = useInvites(orgIdNum);

  const isLoading = orgLoading || projectsLoading || membersLoading || invitesLoading;

  if (isLoading) {
    return (
      <>
        <AppTopbar breadcrumbs={[{ label: "Organizations", href: "/app/orgs" }, { label: "Loading..." }]} />
        <main className="flex-1 overflow-auto p-6">
          <PageSkeleton />
        </main>
      </>
    );
  }

  if (!org) {
    return (
      <>
        <AppTopbar breadcrumbs={[{ label: "Organizations", href: "/app/orgs" }, { label: "Not Found" }]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Organization not found</h1>
            <p className="mt-2 text-muted-foreground">The organization you're looking for doesn't exist.</p>
            <Button className="mt-4" onClick={() => router.push("/app/orgs")}>
              Go to Organizations
            </Button>
          </div>
        </main>
      </>
    );
  }

  const pendingInvites = invites?.filter((i) => i.status === "PENDING") || [];

  return (
    <>
      <AppTopbar breadcrumbs={[{ label: "Organizations", href: "/app/orgs" }, { label: org.name }]} />

      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-start justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Building2 className="h-7 w-7" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
              <p className="text-sm text-muted-foreground">/{org.slug}</p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex gap-2"
          >
            <Button variant="outline" asChild className="bg-transparent transition-transform duration-200 active:scale-95">
              <Link href={`/app/orgs/${orgId}/invites?create=true`}>
                <Mail className="mr-2 h-4 w-4" />
                Invite Member
              </Link>
            </Button>
            <Button asChild className="transition-transform duration-200 active:scale-95">
              <Link href={`/app/orgs/${orgId}/projects?create=true`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            { title: "Projects", value: projects?.length || 0, icon: FolderKanban },
            { title: "Members", value: members?.length || 0, icon: Users },
            { title: "Pending Invites", value: pendingInvites.length, icon: Mail },
          ].map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
            >
              <Card className="transition-shadow duration-200 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
                    className="text-2xl font-bold"
                  >
                    {stat.value}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Projects Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card className="h-full transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Recent projects in this organization</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/app/orgs/${orgId}/projects`}>
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {projects?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects yet. Create your first project to get started.</p>
                ) : (
                  <div className="space-y-3">
                    {projects?.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        href={`/app/orgs/${orgId}/projects/${project.id}`}
                        className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{project.name}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Members Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card className="h-full transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>Team members in this organization</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/app/orgs/${orgId}/members`}>
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {members?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                ) : (
                  <div className="space-y-3">
                    {members?.slice(0, 5).map((member) => (
                      <div key={member.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {member.userName?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.userName}</p>
                            <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                          </div>
                        </div>
                        <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </>
  );
}
