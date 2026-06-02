"use client";

/* ============================================================
   WORKLY — Shared design primitives
   Ported from the Workly redesign prototype to React/TSX.
   These are the visual atoms shared across the board, dashboard,
   issue panel and list views: priority glyphs, label chips,
   avatars, sparklines, donut, bars and progress bars.
   ============================================================ */

import type { Priority, IssueStatus, LabelResponse } from "@/lib/types";

/* ---------- priority ---------- */
// Backend priorities (HIGHEST..LOWEST) mapped to the design's 0..4 glyph scale.
export const PRIORITY_META: Record<
  Priority,
  { label: string; level: number; color: string }
> = {
  HIGHEST: { label: "Urgent", level: 4, color: "var(--red)" },
  HIGH: { label: "High", level: 3, color: "var(--accent)" },
  MEDIUM: { label: "Medium", level: 2, color: "var(--amber)" },
  LOW: { label: "Low", level: 1, color: "var(--blue)" },
  LOWEST: { label: "No priority", level: 0, color: "var(--text-faint)" },
};

export const PRIORITY_ORDER: Priority[] = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"];

/* ---------- status ---------- */
export const STATUS_META: Record<IssueStatus, { label: string; color: string }> = {
  TO_DO: { label: "To Do", color: "var(--blue)" },
  IN_PROGRESS: { label: "In Progress", color: "var(--amber)" },
  IN_REVIEW: { label: "In Review", color: "var(--violet)" },
  DONE: { label: "Done", color: "var(--green)" },
};

export const STATUS_ORDER: IssueStatus[] = ["TO_DO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

/* Deterministic OKLCH hue from any string (for avatar colors). */
export function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ---------- Priority glyph ---------- */
export function PriorityGlyph({
  priority,
  size = 14,
  showLabel = false,
}: {
  priority: Priority;
  size?: number;
  showLabel?: boolean;
}) {
  const meta = PRIORITY_META[priority];
  const level = meta.level;
  let glyph: React.ReactNode;

  if (level === 0) {
    glyph = (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
        {[3, 7, 11].map((x) => (
          <rect key={x} x={x} y={10} width={2.4} height={3.4} rx={1} fill="var(--text-faint)" />
        ))}
      </svg>
    );
  } else if (level === 4) {
    glyph = (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
        <rect x={2} y={2} width={12} height={12} rx={3} fill={meta.color} />
        <rect x={7} y={4.5} width={2} height={5} rx={1} fill="white" />
        <rect x={7} y={11} width={2} height={2} rx={1} fill="white" />
      </svg>
    );
  } else {
    const bars: [number, number, number][] = [
      [3, 8, 5],
      [7, 5, 8],
      [11, 2, 11],
    ];
    glyph = (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
        {bars.map((b, i) => (
          <rect
            key={i}
            x={b[0]}
            y={b[1]}
            width={2.4}
            height={b[2]}
            rx={1}
            fill={i < level ? meta.color : "var(--border-strong)"}
          />
        ))}
      </svg>
    );
  }

  if (!showLabel) {
    return (
      <span title={meta.label} className="inline-flex">
        {glyph}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold"
      style={{ color: meta.color, fontSize: 12 }}
    >
      {glyph}
      {meta.label}
    </span>
  );
}

/* ---------- Label chip ---------- */
export function LabelChip({ label, dot = false }: { label: LabelResponse; dot?: boolean }) {
  // Soften the chip background by overlaying the color at low alpha.
  return (
    <span
      className="inline-flex h-[19px] items-center gap-1.5 rounded-[5px] px-1.5 text-[11px] font-semibold"
      style={{
        background: `color-mix(in oklch, ${label.color} 14%, var(--card))`,
        color: label.color,
      }}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: label.color }}
        />
      )}
      {label.name}
    </span>
  );
}

/* ---------- Avatar ---------- */
export function WorklyAvatar({
  name,
  size = 22,
  ring = false,
}: {
  name?: string | null;
  size?: number;
  ring?: boolean;
}) {
  if (!name) {
    return (
      <div
        className="grid shrink-0 place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          background: "var(--surface-3)",
          color: "var(--text-faint)",
          fontSize: size * 0.42,
          border: "1px dashed var(--border-strong)",
        }}
      >
        ?
      </div>
    );
  }
  const hue = hueFromString(name);
  return (
    <div
      title={name}
      className="grid shrink-0 place-items-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: `oklch(0.92 0.06 ${hue})`,
        color: `oklch(0.42 0.14 ${hue})`,
        fontSize: size * 0.4,
        letterSpacing: "-0.02em",
        boxShadow: ring ? "0 0 0 2px var(--card)" : "none",
      }}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({
  names,
  size = 22,
  max = 4,
}: {
  names: string[];
  size?: number;
  max?: number;
}) {
  const show = names.slice(0, max);
  const extra = names.length - show.length;
  return (
    <div className="flex items-center">
      {show.map((name, i) => (
        <div key={i} style={{ marginLeft: i ? -size * 0.32 : 0, zIndex: show.length - i }}>
          <WorklyAvatar name={name} size={size} ring />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="grid place-items-center rounded-full font-bold"
          style={{
            marginLeft: -size * 0.32,
            width: size,
            height: size,
            background: "var(--surface-3)",
            color: "var(--text-muted)",
            fontSize: size * 0.36,
            boxShadow: "0 0 0 2px var(--card)",
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ---------- Progress bar ---------- */
export function ProgressBar({
  value,
  height = 6,
  color = "var(--accent)",
  track = "var(--surface-3)",
}: {
  value: number;
  height?: number;
  color?: string;
  track?: string;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ height, background: track }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.round(Math.min(Math.max(value, 0), 1) * 100)}%`, background: color }}
      />
    </div>
  );
}

/* ---------- Sparkline ---------- */
export function Sparkline({
  data,
  w = 120,
  h = 34,
  color = "var(--accent)",
  fill = true,
}: {
  data: (number | null)[];
  w?: number;
  h?: number;
  color?: string;
  fill?: boolean;
}) {
  const vals = data.filter((v): v is number => v != null);
  if (vals.length < 2) return <svg width={w} height={h} />;
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const rng = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = v == null ? null : h - 4 - ((v - min) / rng) * (h - 8);
      return [x, y] as [number, number | null];
    })
    .filter((p): p is [number, number] => p[1] != null);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${pts[pts.length - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
  const gid = "sg" + Math.round(color.length * w * h) + data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.22} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.6} fill={color} />
    </svg>
  );
}

/* ---------- Bars ---------- */
export function Bars({
  data,
  w = 120,
  h = 36,
  color = "var(--accent)",
  gap = 4,
}: {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  gap?: number;
}) {
  const max = Math.max(...data) || 1;
  const bw = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const bh = Math.max(3, (v / max) * (h - 2));
        const last = i === data.length - 1;
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={2}
            fill={last ? color : "var(--border-strong)"}
          />
        );
      })}
    </svg>
  );
}

/* ---------- Donut ---------- */
export function Donut({
  segments,
  size = 92,
  thickness = 13,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-off}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        );
        off += len;
        return el;
      })}
    </svg>
  );
}

/* ---------- Due-date helpers ---------- */
export function dueLabel(due: string | null): { text: string; tone: "red" | "amber" | "faint" } | null {
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due + "T00:00:00");
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return { text: `${-diffDays}d overdue`, tone: "red" };
  if (diffDays === 0) return { text: "Today", tone: "red" };
  if (diffDays === 1) return { text: "Tomorrow", tone: "amber" };
  if (diffDays <= 7) return { text: `in ${diffDays}d`, tone: diffDays <= 2 ? "amber" : "faint" };
  return {
    text: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    tone: "faint",
  };
}
