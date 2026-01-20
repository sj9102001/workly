import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const stats = [
  {
    name: "Total Projects",
    value: "12",
    change: "+2 this month",
    icon: FolderKanban,
  },
  {
    name: "Team Members",
    value: "8",
    change: "+1 this week",
    icon: Users,
  },
  {
    name: "Completed Tasks",
    value: "64",
    change: "+12 this week",
    icon: CheckCircle2,
  },
  {
    name: "In Progress",
    value: "23",
    change: "5 due today",
    icon: Clock,
  },
];

const recentProjects = [
  {
    id: "1",
    name: "Website Redesign",
    tasks: 24,
    completed: 18,
    status: "In Progress",
  },
  {
    id: "2",
    name: "Mobile App v2",
    tasks: 32,
    completed: 28,
    status: "In Progress",
  },
  {
    id: "3",
    name: "API Integration",
    tasks: 15,
    completed: 15,
    status: "Completed",
  },
  {
    id: "4",
    name: "Database Migration",
    tasks: 8,
    completed: 2,
    status: "In Progress",
  },
];

const recentActivity = [
  {
    user: "Sarah Chen",
    action: "completed task",
    target: "Update landing page hero",
    time: "2 minutes ago",
  },
  {
    user: "Mike Johnson",
    action: "created task",
    target: "Fix login button alignment",
    time: "15 minutes ago",
  },
  {
    user: "Emily Davis",
    action: "moved task to",
    target: "In Review",
    time: "1 hour ago",
  },
  {
    user: "John Doe",
    action: "commented on",
    target: "API endpoint documentation",
    time: "2 hours ago",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your organization&apos;s projects and activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Link
              href="/dashboard/projects"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{project.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {project.completed}/{project.tasks} tasks
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          project.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(project.completed / project.tasks) * 100}%`,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {activity.user
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-muted-foreground">
                        {activity.action}
                      </span>{" "}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
