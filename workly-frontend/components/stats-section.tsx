import { Github, Users, GitFork, Star } from "lucide-react";

const stats = [
  { value: "100%", label: "Free & Open Source", icon: Github },
  { value: "Self-hosted", label: "Full Control", icon: Users },
  { value: "MIT", label: "License", icon: GitFork },
  { value: "Community", label: "Driven", icon: Star },
];

export function StatsSection() {
  return (
    <section className="border-y border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <stat.icon className="mb-3 h-6 w-6 text-foreground" />
              <p className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
