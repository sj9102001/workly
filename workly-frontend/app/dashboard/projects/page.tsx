"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  FolderKanban,
  Calendar,
  Users,
  Trash2,
  Settings,
  Star,
  Grid3X3,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

type Project = {
  id: string;
  name: string;
  key: string;
  description: string;
  status: "Active" | "On Hold" | "Completed";
  tasksCount: number;
  completedTasks: number;
  members: { name: string; avatar?: string }[];
  createdAt: string;
  starred?: boolean;
};

const initialProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    key: "WEB",
    description: "Complete overhaul of the company website with new branding",
    status: "Active",
    tasksCount: 24,
    completedTasks: 18,
    members: [
      { name: "John Doe" },
      { name: "Sarah Chen" },
      { name: "Mike Johnson" },
    ],
    createdAt: "Jan 15, 2024",
    starred: true,
  },
  {
    id: "2",
    name: "Mobile App v2",
    key: "MOB",
    description: "Second major version of our mobile application",
    status: "Active",
    tasksCount: 32,
    completedTasks: 28,
    members: [{ name: "Emily Davis" }, { name: "Alex Wilson" }],
    createdAt: "Feb 1, 2024",
    starred: true,
  },
  {
    id: "3",
    name: "API Integration",
    key: "API",
    description: "Third-party API integrations for payment and auth",
    status: "Completed",
    tasksCount: 15,
    completedTasks: 15,
    members: [{ name: "John Doe" }, { name: "Mike Johnson" }],
    createdAt: "Dec 10, 2023",
  },
  {
    id: "4",
    name: "Database Migration",
    key: "DBM",
    description: "Migrate from MySQL to PostgreSQL",
    status: "Active",
    tasksCount: 8,
    completedTasks: 2,
    members: [{ name: "Sarah Chen" }],
    createdAt: "Mar 20, 2024",
  },
  {
    id: "5",
    name: "Security Audit",
    key: "SEC",
    description: "Annual security audit and compliance check",
    status: "On Hold",
    tasksCount: 12,
    completedTasks: 4,
    members: [{ name: "Alex Wilson" }, { name: "Emily Davis" }],
    createdAt: "Apr 5, 2024",
  },
  {
    id: "6",
    name: "Documentation",
    key: "DOC",
    description: "Internal and external documentation updates",
    status: "Active",
    tasksCount: 20,
    completedTasks: 12,
    members: [
      { name: "John Doe" },
      { name: "Sarah Chen" },
      { name: "Mike Johnson" },
      { name: "Emily Davis" },
    ],
    createdAt: "Mar 1, 2024",
  },
];

const Loading = () => null;

export default function ProjectsPage() {
  const [projects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    key: "",
    description: "",
  });

  const searchParams = useSearchParams();

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const starredProjects = filteredProjects.filter((p) => p.starred);
  const otherProjects = filteredProjects.filter((p) => !p.starred);

  const handleCreateProject = () => {
    setCreateDialogOpen(false);
    setNewProject({ name: "", key: "", description: "" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "On Hold":
        return "bg-yellow-100 text-yellow-700";
      case "Completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="group hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                {project.key.slice(0, 2)}
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-muted-foreground">{project.key}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Star className="h-4 w-4 mr-2" />
                  {project.starred ? "Unstar" : "Star"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Project settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <Badge className={cn("font-normal", getStatusColor(project.status))}>
              {project.status}
            </Badge>
            <div className="flex -space-x-2">
              {project.members.slice(0, 3).map((member, i) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-muted">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.members.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px]">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {project.completedTasks}/{project.tasksCount} tasks
              </span>
              <span className="text-muted-foreground">
                {Math.round((project.completedTasks / project.tasksCount) * 100)}
                %
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${(project.completedTasks / project.tasksCount) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const ProjectListItem = ({ project }: { project: Project }) => (
    <Link href={`/dashboard/projects/${project.id}`}>
      <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold shrink-0">
          {project.key.slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <Badge className={cn("font-normal shrink-0", getStatusColor(project.status))}>
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {project.description}
          </p>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <FolderKanban className="h-4 w-4" />
            <span>
              {project.completedTasks}/{project.tasksCount}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{project.members.length}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{project.createdAt}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Star className="h-4 w-4 mr-2" />
              {project.starred ? "Unstar" : "Star"}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Project settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage and track your organization&apos;s projects.
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project to your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Website Redesign"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key">Project key</Label>
                  <Input
                    id="key"
                    placeholder="e.g., WEB"
                    maxLength={4}
                    className="uppercase"
                    value={newProject.key}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        key: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Used as a prefix for task IDs (e.g., WEB-123)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this project about?"
                    rows={3}
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProject.name || !newProject.key}
                >
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {starredProjects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              Starred
            </h2>
            {viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {starredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {starredProjects.map((project) => (
                  <ProjectListItem key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {starredProjects.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground">
              All Projects
            </h2>
          )}
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {otherProjects.map((project) => (
                <ProjectListItem key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}
