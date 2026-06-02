"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  Users,
  Mail,
  Settings,
  CornerDownLeft,
  Building2,
} from "lucide-react";
import { useOrganizations, useProjects } from "@/hooks/use-queries";

type Action = {
  group: string;
  label: string;
  meta?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

/**
 * Global ⌘K / Ctrl-K command palette. Jumps to org sections, projects and
 * organizations. Mounted once in the app layout.
 */
export function CommandPalette() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId ? Number(params.orgId) : null;

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: organizations } = useOrganizations();
  const { data: projects } = useProjects(orgId);

  // global hotkey
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const actions = useMemo<Action[]>(() => {
    const a: Action[] = [];
    if (orgId) {
      a.push(
        { group: "Navigate", label: "Go to Dashboard", icon: LayoutDashboard, run: () => go(`/app/orgs/${orgId}`) },
        { group: "Navigate", label: "Projects", icon: FolderKanban, run: () => go(`/app/orgs/${orgId}/projects`) },
        { group: "Navigate", label: "Members", icon: Users, run: () => go(`/app/orgs/${orgId}/members`) },
        { group: "Navigate", label: "Invites", icon: Mail, run: () => go(`/app/orgs/${orgId}/invites`) },
        { group: "Navigate", label: "Settings", icon: Settings, run: () => go(`/app/orgs/${orgId}/settings`) }
      );
    }
    (projects ?? []).forEach((p) =>
      a.push({
        group: "Projects",
        label: p.name,
        meta: p.slug?.toUpperCase(),
        icon: FolderKanban,
        run: () => go(`/app/orgs/${orgId}/projects/${p.id}/board`),
      })
    );
    (organizations ?? []).forEach((o) =>
      a.push({
        group: "Organizations",
        label: o.name,
        icon: Building2,
        run: () => go(`/app/orgs/${o.id}`),
      })
    );
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projects, organizations]);

  const filtered = useMemo(
    () =>
      actions
        .filter((act) => (act.label + " " + (act.meta ?? "")).toLowerCase().includes(q.toLowerCase()))
        .slice(0, 9),
    [actions, q]
  );

  useEffect(() => setSel(0), [q]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[sel]?.run();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let lastGroup: string | null = null;

  return (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[12vh]"
      style={{ background: "oklch(0.15 0.01 70 / 0.4)", backdropFilter: "blur(3px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-border-strong w-[min(560px,92vw)] overflow-hidden rounded-xl border shadow-2xl"
        style={{ animation: "wk-pop-in 0.16s ease" }}
      >
        <div className="border-border flex items-center gap-2.5 border-b px-4 py-3">
          <Search className="text-text-muted h-[17px] w-[17px]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search projects, organizations, actions…"
            className="text-foreground flex-1 border-none bg-transparent text-[15px] outline-none"
          />
          <span className="bg-surface-3 text-text-muted border-border rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold">
            Esc
          </span>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <div className="text-text-faint p-7 text-center text-sm">No results</div>
          )}
          {filtered.map((act, i) => {
            const head = act.group !== lastGroup ? (lastGroup = act.group) : null;
            const active = i === sel;
            const Icon = act.icon;
            return (
              <div key={i}>
                {head && (
                  <div className="text-text-faint px-2 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-wider">
                    {head}
                  </div>
                )}
                <button
                  onClick={() => act.run()}
                  onMouseEnter={() => setSel(i)}
                  className={`flex h-[38px] w-full items-center gap-2.5 rounded-md px-2.5 text-left ${
                    active ? "bg-surface-3" : ""
                  }`}
                >
                  <Icon className="text-text-muted h-[15px] w-[15px] shrink-0" />
                  <span className="flex-1 truncate text-[13px] font-medium">{act.label}</span>
                  {act.meta && <span className="text-text-faint font-mono text-[11px]">{act.meta}</span>}
                  {active && <CornerDownLeft className="text-text-faint h-3.5 w-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
