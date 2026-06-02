"use client";

import { useState } from "react";
import { Plus, Trash2, Play, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useIssues,
  useProjectMembers,
  useActiveSprint,
  useSprints,
  useCreateSprint,
  useUpdateSprint,
  useLabels,
  useCreateLabel,
  useDeleteLabel,
  useActivity,
} from "@/hooks/use-queries";
import type { ActivityType } from "@/lib/types";
import {
  Donut,
  ProgressBar,
  WorklyAvatar,
  STATUS_META,
  STATUS_ORDER,
} from "@/components/workly/primitives";

const LABEL_COLORS = [
  "#f97316",
  "#ef4444",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

const ACTIVITY_VERB: Record<ActivityType, string> = {
  ISSUE_CREATED: "created",
  ISSUE_MOVED: "moved",
  ISSUE_ASSIGNED: "assigned",
  ISSUE_COMMENTED: "commented on",
  ISSUE_COMPLETED: "completed",
  ISSUE_REOPENED: "reopened",
};

function CardHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-start justify-between gap-2.5">
      <div>
        <div className="font-display text-[14.5px] font-bold tracking-tight">{title}</div>
        {sub && <div className="text-text-faint mt-px text-[11.5px]">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function ProjectSummary({ orgId, projectId }: { orgId: number; projectId: number }) {
  const { data: issues = [] } = useIssues(orgId, projectId);
  const { data: members = [] } = useProjectMembers(orgId, projectId);
  const { data: activeSprint } = useActiveSprint(orgId, projectId);
  const { data: sprints = [] } = useSprints(orgId, projectId);
  const { data: labels = [] } = useLabels(orgId, projectId);
  const { data: activity = [] } = useActivity(orgId, projectId, 8);

  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const createLabel = useCreateLabel();
  const deleteLabel = useDeleteLabel();

  const [sprintDialog, setSprintDialog] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: "", goal: "", startDate: "", endDate: "" });
  const [newLabel, setNewLabel] = useState({ name: "", color: LABEL_COLORS[0] });

  const memberName = (userId: number | null) =>
    userId != null ? members.find((m) => m.userId === userId)?.userName ?? null : null;

  // status distribution
  const dist = STATUS_ORDER.map((s) => ({
    key: s,
    label: STATUS_META[s].label,
    color: STATUS_META[s].color,
    n: issues.filter((i) => i.status === s).length,
  }));
  const donutSegs = dist.map((d) => ({ value: d.n, color: d.color }));

  const sprintPct = activeSprint && activeSprint.pointsTotal ? activeSprint.pointsDone / activeSprint.pointsTotal : 0;

  const handleCreateSprint = async () => {
    if (!newSprint.name.trim()) return;
    await createSprint.mutateAsync({
      orgId,
      projectId,
      data: {
        name: newSprint.name.trim(),
        goal: newSprint.goal || undefined,
        startDate: newSprint.startDate || undefined,
        endDate: newSprint.endDate || undefined,
      },
    });
    setSprintDialog(false);
    setNewSprint({ name: "", goal: "", startDate: "", endDate: "" });
  };

  const handleAddLabel = async () => {
    if (!newLabel.name.trim()) return;
    await createLabel.mutateAsync({ orgId, projectId, name: newLabel.name.trim(), color: newLabel.color });
    setNewLabel({ name: "", color: LABEL_COLORS[0] });
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      {/* top: sprint + breakdown */}
      <div className="mb-3 grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        {/* active sprint */}
        <div className="bg-card rounded-xl border p-4">
          <CardHead
            title="Active sprint"
            sub={activeSprint?.goal ?? "No goal set"}
            action={
              activeSprint ? (
                <span
                  className="inline-flex h-[22px] items-center gap-1.5 rounded-[5px] border px-2 text-[11px] font-semibold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent-text)", borderColor: "var(--accent-soft-bd)" }}
                >
                  <span className="bg-accent h-1.5 w-1.5 rounded-full" />
                  {activeSprint.name}
                </span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setSprintDialog(true)}>
                  <Plus className="h-3.5 w-3.5" /> Sprint
                </Button>
              )
            }
          />
          {activeSprint ? (
            <>
              <div className="mb-1.5 flex items-baseline gap-1.5">
                <span className="font-display tnum text-[22px] font-bold tracking-tight">{activeSprint.pointsDone}</span>
                <span className="text-text-faint text-[13px] font-semibold">/ {activeSprint.pointsTotal} pts</span>
                <span className="bg-green-soft text-green ml-auto inline-flex items-center rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold">
                  {Math.round(sprintPct * 100)}% done
                </span>
              </div>
              <ProgressBar value={sprintPct} height={7} />
              <div className="text-text-faint mt-1.5 flex justify-between text-[11px]">
                <span>{activeSprint.issueCount} issues</span>
                <span>{activeSprint.pointsTotal - activeSprint.pointsDone} pts remaining</span>
              </div>
            </>
          ) : (
            <div className="text-text-faint flex flex-col items-start gap-2 py-4 text-[12.5px]">
              <Zap className="text-text-faint h-5 w-5" />
              No active sprint. Create one and activate it to track velocity.
            </div>
          )}

          {/* other sprints */}
          {sprints.length > 0 && (
            <div className="mt-4">
              <div className="text-text-faint mb-2 text-[11px] font-bold uppercase tracking-wider">Sprints</div>
              <div className="flex flex-col gap-1">
                {sprints.map((s) => (
                  <div key={s.id} className="hover:bg-hover flex items-center gap-2 rounded-md px-2 py-1.5">
                    <span className="flex-1 truncate text-[12.5px] font-medium">{s.name}</span>
                    <span
                      className="rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-semibold"
                      style={{
                        background: s.status === "ACTIVE" ? "var(--accent-soft)" : "var(--surface-3)",
                        color: s.status === "ACTIVE" ? "var(--accent-text)" : "var(--text-muted)",
                      }}
                    >
                      {s.status}
                    </span>
                    {s.status !== "ACTIVE" && s.status !== "COMPLETED" && (
                      <button
                        title="Activate sprint"
                        onClick={() => updateSprint.mutate({ orgId, projectId, sprintId: s.id, data: { status: "ACTIVE" } })}
                        className="text-text-muted hover:text-accent"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {s.status === "ACTIVE" && (
                      <button
                        title="Complete sprint"
                        onClick={() => updateSprint.mutate({ orgId, projectId, sprintId: s.id, data: { status: "COMPLETED" } })}
                        className="text-text-muted hover:text-green"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Button size="sm" variant="ghost" className="text-text-muted mt-1 h-7" onClick={() => setSprintDialog(true)}>
                <Plus className="h-3.5 w-3.5" /> New sprint
              </Button>
            </div>
          )}
        </div>

        {/* breakdown donut */}
        <div className="bg-card flex flex-col rounded-xl border p-4">
          <CardHead title="Issue breakdown" sub="By status" />
          <div className="flex flex-1 items-center gap-4">
            <div className="relative shrink-0">
              <Donut segments={donutSegs} size={104} thickness={15} />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="font-display tnum text-2xl font-bold leading-none">{issues.length}</div>
                  <div className="text-text-faint text-[10px] font-semibold">total</div>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {dist.map((d) => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: d.color }} />
                  <span className="text-text-2 flex-1 text-xs font-medium">{d.label}</span>
                  <span className="font-mono tnum text-xs font-semibold">{d.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* bottom: activity + labels */}
      <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        {/* activity feed */}
        <div className="bg-card rounded-xl border p-4">
          <CardHead title="Recent activity" sub="What the team has been up to" />
          {activity.length === 0 ? (
            <p className="text-text-faint text-xs">No activity yet.</p>
          ) : (
            <div className="flex flex-col">
              {activity.map((a, i) => (
                <div key={a.id} className={`flex items-center gap-3 py-2 ${i ? "border-border-soft border-t" : ""}`}>
                  <WorklyAvatar name={a.actorName} size={24} />
                  <div className="text-text-2 min-w-0 flex-1 text-[12.5px]">
                    <span className="text-foreground font-semibold">{a.actorName.split(" ")[0]}</span>{" "}
                    {ACTIVITY_VERB[a.type]}{" "}
                    {a.targetTitle && <span className="text-foreground font-semibold">{a.targetTitle}</span>}
                    {a.meta && <span className="text-text-faint">{"  ·  " + a.meta}</span>}
                  </div>
                  <span className="text-text-faint shrink-0 font-mono text-[11px]">{relativeTime(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* labels management */}
        <div className="bg-card rounded-xl border p-4">
          <CardHead title="Labels" sub="Tag issues across the project" />
          <div className="mb-3 flex flex-wrap gap-1.5">
            {labels.length === 0 && <span className="text-text-faint text-xs">No labels yet.</span>}
            {labels.map((l) => (
              <span
                key={l.id}
                className="group inline-flex h-[22px] items-center gap-1.5 rounded-[5px] px-2 text-[11px] font-semibold"
                style={{ background: `color-mix(in oklch, ${l.color} 14%, var(--card))`, color: l.color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
                {l.name}
                <button
                  onClick={() => deleteLabel.mutate({ orgId, projectId, labelId: l.id })}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  title="Delete label"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewLabel({ ...newLabel, color: c })}
                  className="h-5 w-5 rounded-full border-2"
                  style={{ background: c, borderColor: newLabel.color === c ? "var(--foreground)" : "transparent" }}
                  aria-label={`color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={newLabel.name}
              onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
              placeholder="New label name…"
              className="h-8 text-[12.5px]"
            />
            <Button size="sm" className="h-8" disabled={!newLabel.name.trim() || createLabel.isPending} onClick={handleAddLabel}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* create sprint dialog */}
      <Dialog open={sprintDialog} onOpenChange={setSprintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">New sprint</DialogTitle>
            <DialogDescription>Plan a time-boxed sprint for this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Name *</Label>
              <Input
                id="sprint-name"
                placeholder="Sprint 1"
                value={newSprint.name}
                onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-goal">Goal</Label>
              <Textarea
                id="sprint-goal"
                placeholder="What should this sprint achieve?"
                value={newSprint.goal}
                onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sprint-start">Start</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={newSprint.startDate}
                  onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-end">End</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSprintDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSprint} disabled={!newSprint.name.trim() || createSprint.isPending}>
              {createSprint.isPending ? "Creating…" : "Create sprint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
