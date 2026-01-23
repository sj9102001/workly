"use client";

import React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Tag,
  User,
  MessageSquare,
  Paperclip,
  ChevronLeft,
  Filter,
  Search,
  GripVertical,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high" | "urgent";
type TaskType = "task" | "bug" | "story" | "epic";

type Task = {
  id: string;
  key: string;
  title: string;
  description?: string;
  status: string;
  priority: Priority;
  type: TaskType;
  assignee?: { name: string; avatar?: string };
  labels: string[];
  dueDate?: string;
  comments: number;
  attachments: number;
  subtasks?: { total: number; completed: number };
};

type Column = {
  id: string;
  title: string;
  tasks: Task[];
};

const initialColumns: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    tasks: [
      {
        id: "1",
        key: "WEB-101",
        title: "Research competitor websites",
        description: "Analyze competitor designs and features",
        status: "backlog",
        priority: "low",
        type: "task",
        labels: ["research"],
        comments: 2,
        attachments: 0,
      },
      {
        id: "2",
        key: "WEB-102",
        title: "Define color palette",
        status: "backlog",
        priority: "medium",
        type: "task",
        assignee: { name: "Sarah Chen" },
        labels: ["design"],
        comments: 5,
        attachments: 1,
      },
    ],
  },
  {
    id: "todo",
    title: "To Do",
    tasks: [
      {
        id: "3",
        key: "WEB-103",
        title: "Create wireframes for homepage",
        description: "Design low-fidelity wireframes",
        status: "todo",
        priority: "high",
        type: "story",
        assignee: { name: "Emily Davis" },
        labels: ["design", "homepage"],
        dueDate: "Jan 25",
        comments: 8,
        attachments: 3,
        subtasks: { total: 5, completed: 2 },
      },
      {
        id: "4",
        key: "WEB-104",
        title: "Set up development environment",
        status: "todo",
        priority: "medium",
        type: "task",
        assignee: { name: "Mike Johnson" },
        labels: ["setup"],
        comments: 1,
        attachments: 0,
      },
      {
        id: "5",
        key: "WEB-105",
        title: "Fix navigation menu overlap on mobile",
        status: "todo",
        priority: "urgent",
        type: "bug",
        assignee: { name: "John Doe" },
        labels: ["bug", "mobile"],
        dueDate: "Jan 20",
        comments: 3,
        attachments: 2,
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    tasks: [
      {
        id: "6",
        key: "WEB-106",
        title: "Implement responsive navigation",
        description: "Build mobile-first navigation component",
        status: "in-progress",
        priority: "high",
        type: "story",
        assignee: { name: "John Doe" },
        labels: ["frontend", "navigation"],
        dueDate: "Jan 22",
        comments: 12,
        attachments: 4,
        subtasks: { total: 8, completed: 5 },
      },
      {
        id: "7",
        key: "WEB-107",
        title: "Design system documentation",
        status: "in-progress",
        priority: "medium",
        type: "task",
        assignee: { name: "Sarah Chen" },
        labels: ["documentation"],
        comments: 6,
        attachments: 2,
      },
    ],
  },
  {
    id: "in-review",
    title: "In Review",
    tasks: [
      {
        id: "8",
        key: "WEB-108",
        title: "Hero section implementation",
        description: "Complete hero section with animations",
        status: "in-review",
        priority: "high",
        type: "story",
        assignee: { name: "Emily Davis" },
        labels: ["frontend", "homepage"],
        comments: 15,
        attachments: 5,
        subtasks: { total: 6, completed: 6 },
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    tasks: [
      {
        id: "9",
        key: "WEB-109",
        title: "Project setup and configuration",
        status: "done",
        priority: "high",
        type: "task",
        assignee: { name: "Mike Johnson" },
        labels: ["setup"],
        comments: 4,
        attachments: 1,
      },
      {
        id: "10",
        key: "WEB-110",
        title: "Initial design mockups",
        status: "done",
        priority: "medium",
        type: "task",
        assignee: { name: "Sarah Chen" },
        labels: ["design"],
        comments: 20,
        attachments: 8,
      },
    ],
  },
];

const projectData = {
  "1": { name: "Website Redesign", key: "WEB" },
  "2": { name: "Mobile App v2", key: "MOB" },
  "3": { name: "API Integration", key: "API" },
  "4": { name: "Database Migration", key: "DBM" },
  "5": { name: "Security Audit", key: "SEC" },
  "6": { name: "Documentation", key: "DOC" },
};

function Loading() {
  return null;
}

export default function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const searchParams = useSearchParams();
  const { id } = searchParams ? { id: searchParams.get("id") } : { id: null };
  const project = projectData[id as keyof typeof projectData] || {
    name: "Project",
    key: "PRJ",
  };

  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [searchQuery, setSearchQuery] = useState("");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
    type: "task" as TaskType,
    columnId: "todo",
  });
  const [draggedTask, setDraggedTask] = useState<{
    task: Task;
    columnId: string;
  } | null>(null);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "urgent":
        return "text-red-600";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-blue-500";
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className={cn("h-4 w-4", getPriorityColor(priority))} />;
      case "high":
        return (
          <svg
            className={cn("h-4 w-4", getPriorityColor(priority))}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L2 22h20L12 2z" />
          </svg>
        );
      case "medium":
        return (
          <svg
            className={cn("h-4 w-4", getPriorityColor(priority))}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <rect x="4" y="10" width="16" height="4" />
          </svg>
        );
      case "low":
        return (
          <svg
            className={cn("h-4 w-4", getPriorityColor(priority))}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 22L2 2h20L12 22z" />
          </svg>
        );
    }
  };

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case "bug":
        return (
          <div className="h-4 w-4 rounded-sm bg-red-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">B</span>
          </div>
        );
      case "story":
        return (
          <div className="h-4 w-4 rounded-sm bg-green-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">S</span>
          </div>
        );
      case "epic":
        return (
          <div className="h-4 w-4 rounded-sm bg-purple-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">E</span>
          </div>
        );
      default:
        return (
          <div className="h-4 w-4 rounded-sm bg-blue-500 flex items-center justify-center">
            <CheckCircle2 className="h-3 w-3 text-white" />
          </div>
        );
    }
  };

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggedTask({ task, columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask) return;

    if (draggedTask.columnId === targetColumnId) {
      setDraggedTask(null);
      return;
    }

    setColumns((prev) => {
      const newColumns = prev.map((col) => {
        if (col.id === draggedTask.columnId) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== draggedTask.task.id),
          };
        }
        if (col.id === targetColumnId) {
          return {
            ...col,
            tasks: [
              ...col.tasks,
              { ...draggedTask.task, status: targetColumnId },
            ],
          };
        }
        return col;
      });
      return newColumns;
    });

    setDraggedTask(null);
  };

  const handleCreateTask = () => {
    const taskId = String(Date.now());
    const taskKey = `${project.key}-${111 + columns.flatMap((c) => c.tasks).length}`;

    const task: Task = {
      id: taskId,
      key: taskKey,
      title: newTask.title,
      description: newTask.description,
      status: newTask.columnId,
      priority: newTask.priority,
      type: newTask.type,
      labels: [],
      comments: 0,
      attachments: 0,
    };

    setColumns((prev) =>
      prev.map((col) =>
        col.id === newTask.columnId ? { ...col, tasks: [...col.tasks, task] } : col
      )
    );

    setCreateTaskOpen(false);
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      type: "task",
      columnId: "todo",
    });
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.key.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Header */}
        <div className="border-b bg-background px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard/projects"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary text-sm font-semibold">
                  {project.key.slice(0, 2)}
                </div>
                <h1 className="text-xl font-bold">{project.name}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tabs defaultValue="board">
              <TabsList className="h-8">
                <TabsTrigger value="board" className="text-xs px-2.5 h-6">Board</TabsTrigger>
                <TabsTrigger value="list" className="text-xs px-2.5 h-6">List</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs px-2.5 h-6">Timeline</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex-1" />

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative hidden sm:block">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-7 h-8 w-[140px] text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 px-2 bg-transparent">
                <Filter className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">Filter</span>
              </Button>
              <Button size="sm" className="h-8 px-2.5" onClick={() => setCreateTaskOpen(true)}>
                <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">Create</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-3 h-full">
            {filteredColumns.map((column) => (
              <div
                key={column.id}
                className="flex flex-col w-[260px] min-w-[220px] shrink-0 bg-muted/30 rounded-lg"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2.5 py-2 border-b">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-xs">{column.title}</h3>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {column.tasks.length}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setNewTask({ ...newTask, columnId: column.id });
                      setCreateTaskOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task, column.id)}
                      onClick={() => openTaskDetail(task)}
                      className={cn(
                        "bg-background rounded-md border p-2 cursor-pointer hover:border-primary/50 transition-all",
                        "hover:shadow-sm group",
                        draggedTask?.task.id === task.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(task.type)}
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {task.key}
                          </span>
                        </div>
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                      </div>

                      <h4 className="mt-1.5 text-xs font-medium leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      {task.labels.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-0.5">
                          {task.labels.slice(0, 2).map((label) => (
                            <Badge
                              key={label}
                              variant="secondary"
                              className="text-[9px] px-1 py-0 h-4"
                            >
                              {label}
                            </Badge>
                          ))}
                          {task.labels.length > 2 && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 h-4"
                            >
                              +{task.labels.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      {task.subtasks && (
                        <div className="mt-1.5">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                            <span>Subtasks</span>
                            <span>
                              {task.subtasks.completed}/{task.subtasks.total}
                            </span>
                          </div>
                          <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(task.subtasks.completed / task.subtasks.total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {getPriorityIcon(task.priority)}
                          {task.dueDate && (
                            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Clock className="h-2.5 w-2.5" />
                              {task.dueDate}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {task.comments > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <MessageSquare className="h-2.5 w-2.5" />
                              {task.comments}
                            </div>
                          )}
                          {task.attachments > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Paperclip className="h-2.5 w-2.5" />
                              {task.attachments}
                            </div>
                          )}
                          {task.assignee && (
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[9px] bg-muted">
                                {task.assignee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Task Dialog */}
        <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>
                Add a new task to {project.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="Add more details..."
                  rows={3}
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newTask.type}
                    onValueChange={(v) =>
                      setNewTask({ ...newTask, type: v as TaskType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) =>
                      setNewTask({ ...newTask, priority: v as Priority })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newTask.columnId}
                  onValueChange={(v) => setNewTask({ ...newTask, columnId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateTaskOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={!newTask.title}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Detail Dialog */}
        <Dialog open={taskDetailOpen} onOpenChange={setTaskDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedTask && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(selectedTask.type)}
                    <span className="text-sm text-muted-foreground font-mono">
                      {selectedTask.key}
                    </span>
                  </div>
                  <DialogTitle className="text-xl mt-2">
                    {selectedTask.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-6 py-4">
                  <div className="col-span-2 space-y-6">
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="mt-2 text-sm">
                        {selectedTask.description || "No description provided."}
                      </p>
                    </div>

                    {selectedTask.subtasks && (
                      <div>
                        <Label className="text-muted-foreground">
                          Subtasks ({selectedTask.subtasks.completed}/
                          {selectedTask.subtasks.total})
                        </Label>
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${(selectedTask.subtasks.completed / selectedTask.subtasks.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-muted-foreground">Activity</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">JD</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Add a comment..."
                              rows={2}
                              className="resize-none"
                            />
                            <Button size="sm" className="mt-2">
                              Comment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Status
                      </Label>
                      <Select defaultValue={selectedTask.status}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Assignee
                      </Label>
                      <div className="mt-1 flex items-center gap-2 p-2 border rounded-md">
                        {selectedTask.assignee ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">
                                {selectedTask.assignee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {selectedTask.assignee.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Priority
                      </Label>
                      <div className="mt-1 flex items-center gap-2 p-2 border rounded-md">
                        {getPriorityIcon(selectedTask.priority)}
                        <span className="text-sm capitalize">
                          {selectedTask.priority}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Labels
                      </Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedTask.labels.length > 0 ? (
                          selectedTask.labels.map((label) => (
                            <Badge key={label} variant="secondary">
                              {label}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No labels
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedTask.dueDate && (
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          Due Date
                        </Label>
                        <div className="mt-1 flex items-center gap-2 p-2 border rounded-md">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedTask.dueDate}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
