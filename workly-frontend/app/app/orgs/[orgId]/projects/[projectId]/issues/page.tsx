"use client";

import { use, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, ArrowUpDown } from "lucide-react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { NoIssues } from "@/components/app-shell/empty-states";
import { TableSkeleton } from "@/components/app-shell/skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useOrganization,
  useProject,
  useColumns,
  useIssues,
  useCreateIssue,
} from "@/hooks/use-queries";

const priorityColors: Record<string, string> = {
  HIGHEST: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-blue-500 text-white",
  LOWEST: "bg-gray-400 text-white",
};

const statusColors: Record<string, string> = {
  TO_DO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
};

function IssuesPageContent({ orgId, projectId }: { orgId: string; projectId: string }) {
  const orgIdNum = Number(orgId);
  const projectIdNum = Number(projectId);
  const router = useRouter();
  const searchParams = useSearchParams();

  const columnIdParam = searchParams.get("columnId");
  const statusParam = searchParams.get("status");

  const { data: org } = useOrganization(orgIdNum);
  const { data: project } = useProject(orgIdNum, projectIdNum);
  const { data: columns } = useColumns(orgIdNum, projectIdNum);
  const { data: issues, isLoading } = useIssues(orgIdNum, projectIdNum, {
    columnId: columnIdParam ? Number(columnIdParam) : undefined,
    status: statusParam || undefined,
  });
  const createIssue = useCreateIssue();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TO_DO",
    columnId: "",
  });

  const handleCreate = async () => {
    if (!newIssue.title.trim() || !newIssue.columnId) return;
    await createIssue.mutateAsync({
      orgId: orgIdNum,
      projectId: projectIdNum,
      data: {
        title: newIssue.title,
        description: newIssue.description || undefined,
        priority: newIssue.priority,
        status: newIssue.status,
        columnId: Number(newIssue.columnId),
      },
    });
    setIsCreateOpen(false);
    setNewIssue({ title: "", description: "", priority: "MEDIUM", status: "TO_DO", columnId: columns?.[0]?.id ? String(columns[0].id) : "" });
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: "Organizations", href: "/app/orgs" },
          { label: org?.name || "...", href: `/app/orgs/${orgId}` },
          { label: "Projects", href: `/app/orgs/${orgId}/projects` },
          { label: project?.name || "...", href: `/app/orgs/${orgId}/projects/${projectId}` },
          { label: "Issues" },
        ]}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Issues</h1>
            <p className="text-sm text-muted-foreground">All issues in this project</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Issue
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-3">
          <Select value={columnIdParam || "all"} onValueChange={(v) => updateFilter("columnId", v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Columns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Columns</SelectItem>
              {columns?.map((column) => (
                <SelectItem key={column.id} value={String(column.id)}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusParam || "all"} onValueChange={(v) => updateFilter("status", v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="TO_DO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : issues?.length === 0 ? (
          <NoIssues onCreateIssue={() => setIsCreateOpen(true)} />
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="h-8 p-0">
                      Updated
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues?.map((issue) => (
                  <TableRow
                    key={issue.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/app/orgs/${orgId}/projects/${projectId}/issues/${issue.id}`)
                    }
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{issue.id}
                    </TableCell>
                    <TableCell className="font-medium">{issue.title}</TableCell>
                    <TableCell>
                      <Badge className={priorityColors[issue.priority]}>{issue.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[issue.status]}>
                        {issue.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">User #{issue.reporterId}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {issue.assigneeId ? `User #${issue.assigneeId}` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(issue.updatedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Create Issue Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Issue</DialogTitle>
            <DialogDescription>Add a new issue to track work.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Issue title"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue..."
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newIssue.priority}
                  onValueChange={(v) => setNewIssue({ ...newIssue, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGHEST">Highest</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="LOWEST">Lowest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newIssue.status}
                  onValueChange={(v) => setNewIssue({ ...newIssue, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TO_DO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Column *</Label>
              <Select
                value={newIssue.columnId}
                onValueChange={(v) => setNewIssue({ ...newIssue, columnId: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column (required)" />
                </SelectTrigger>
                <SelectContent>
                  {columns?.map((column) => (
                    <SelectItem key={column.id} value={String(column.id)}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newIssue.title.trim() || !newIssue.columnId || createIssue.isPending}>
              {createIssue.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function IssuesPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = use(params);

  return (
    <Suspense fallback={<TableSkeleton rows={10} />}>
      <IssuesPageContent orgId={orgId} projectId={projectId} />
    </Suspense>
  );
}
