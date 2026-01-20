"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const columns = [
  {
    id: "backlog",
    title: "Backlog",
    cards: [
      { id: 1, title: "Research competitor features", priority: "low", assignee: "JD", type: "story" },
      { id: 2, title: "Update API documentation", priority: "medium", assignee: "SK", type: "task" },
    ],
  },
  {
    id: "todo",
    title: "To Do",
    cards: [
      { id: 3, title: "Design user onboarding flow", priority: "high", assignee: "AM", type: "story" },
      { id: 4, title: "Fix login timeout issue", priority: "high", assignee: "JD", type: "bug" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [
      { id: 5, title: "Implement SSO integration", priority: "high", assignee: "SK", type: "story" },
    ],
  },
  {
    id: "review",
    title: "In Review",
    cards: [
      { id: 6, title: "Add export to CSV feature", priority: "medium", assignee: "AM", type: "story" },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [
      { id: 7, title: "Set up CI/CD pipeline", priority: "medium", assignee: "JD", type: "task" },
    ],
  },
];

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const typeColors: Record<string, string> = {
  story: "border-blue-500",
  bug: "border-red-500",
  task: "border-green-500",
};

export function BoardPreview() {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <section className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Product Preview
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See your work clearly
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Drag-and-drop task boards that adapt to your workflow. Customize columns, add automations, and keep everyone on the same page.
          </p>
        </div>
        <div className="mt-12 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <span className="text-xs font-bold text-primary-foreground">W</span>
              </div>
              <span className="font-semibold text-foreground">Sprint 23 - Mobile App</span>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <div className="flex -space-x-2">
              <Avatar className="h-7 w-7 border-2 border-card">
                <AvatarFallback className="bg-blue-500 text-xs text-white">JD</AvatarFallback>
              </Avatar>
              <Avatar className="h-7 w-7 border-2 border-card">
                <AvatarFallback className="bg-green-500 text-xs text-white">SK</AvatarFallback>
              </Avatar>
              <Avatar className="h-7 w-7 border-2 border-card">
                <AvatarFallback className="bg-orange-500 text-xs text-white">AM</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto p-4">
            {columns.map((column) => (
              <div key={column.id} className="flex w-64 flex-shrink-0 flex-col rounded-lg bg-muted/50 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {column.cards.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {column.cards.map((card) => (
                    <div
                      key={card.id}
                      className={`cursor-pointer rounded-lg border-l-2 bg-card p-3 shadow-sm transition-all hover:shadow-md ${typeColors[card.type]} ${activeCard === card.id ? "ring-2 ring-primary" : ""}`}
                      onMouseEnter={() => setActiveCard(card.id)}
                      onMouseLeave={() => setActiveCard(null)}
                    >
                      <p className="text-sm font-medium text-foreground">{card.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${priorityColors[card.priority]}`}>
                          {card.priority}
                        </span>
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-muted text-xs">{card.assignee}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
