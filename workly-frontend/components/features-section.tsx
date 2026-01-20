import {
  LayoutDashboard,
  Zap,
  Users,
  BarChart3,
  GitBranch,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    name: "Agile Boards",
    description:
      "Visualize work with customizable Kanban and Scrum boards. Drag-and-drop cards, set WIP limits, and track progress at a glance.",
  },
  {
    icon: Zap,
    name: "Sprint Planning",
    description:
      "Plan sprints with story points, capacity tracking, and velocity charts. Break down epics into manageable tasks effortlessly.",
  },
  {
    icon: Users,
    name: "Team Collaboration",
    description:
      "Real-time updates, @mentions, comments, and file attachments. Keep everyone aligned and informed across projects.",
  },
  {
    icon: BarChart3,
    name: "Advanced Reporting",
    description:
      "Burn-down charts, cumulative flow diagrams, and custom dashboards. Get insights that drive better decisions.",
  },
  {
    icon: GitBranch,
    name: "Dev Integrations",
    description:
      "Connect with GitHub, GitLab, Bitbucket, and CI/CD tools. Link commits, PRs, and builds directly to issues.",
  },
  {
    icon: Shield,
    name: "Enterprise Security",
    description:
      "SSO, SCIM, audit logs, and granular permissions. SOC 2 Type II certified for peace of mind.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Features
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your team needs to ship faster
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            From sprint planning to release, Workly gives you the tools to manage every aspect of your development workflow.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <feature.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {feature.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
