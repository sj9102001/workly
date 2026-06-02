"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  Mail,
  FileText,
  Settings,
  ChevronsUpDown,
  Plus,
  LogOut,
  User,
  Search,
  Layers,
  Inbox,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useOrganizations, useProjects } from "@/hooks/use-queries";
import { issueApi } from "@/lib/api";
import { WorklyAvatar } from "@/components/workly/primitives";

interface AppSidebarProps {
  currentOrgId?: number;
  onOrgChange?: (orgId: number) => void;
  onCreateOrg?: () => void;
}

const PROJECT_HUES = [45, 245, 295, 150, 195, 70];

/** Opens the global ⌘K command palette by dispatching the hotkey. */
function openCommandPalette() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  active: boolean;
  badge?: number | string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-[31px] items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors"
      style={{
        color: active ? "var(--foreground)" : "var(--text-2)",
        background: active ? "var(--surface-3)" : "transparent",
        fontWeight: active ? 600 : 500,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {active && (
        <span className="bg-accent absolute -left-2.5 top-1.5 bottom-1.5 w-[2.5px] rounded-full" />
      )}
      <Icon
        className="h-4 w-4 shrink-0"
        style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
      />
      <span className="flex-1 text-left">{label}</span>
      {badge != null && (
        <span className="text-text-muted font-mono text-[11px] font-semibold">{badge}</span>
      )}
    </Link>
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-1 flex h-[18px] items-center justify-between px-2.5">
      <span className="text-text-faint text-[10.5px] font-bold uppercase tracking-wider">{children}</span>
      {action}
    </div>
  );
}

export function AppSidebar({ currentOrgId, onOrgChange, onCreateOrg }: AppSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { user, logout } = useAuth();
  const { data: organizations, isLoading: orgsLoading } = useOrganizations();

  const orgId = currentOrgId || (params.orgId ? Number(params.orgId) : null);
  const currentOrg = organizations?.find((org) => org.id === orgId);
  const { data: projects } = useProjects(orgId);

  // Per-project open-issue counts for the sidebar badges.
  const issueCountQueries = useQueries({
    queries: (projects ?? []).map((p) => ({
      queryKey: ["issues", orgId, p.id, undefined] as const,
      queryFn: () => issueApi.list(orgId!, p.id),
      enabled: !!orgId && !!projects,
    })),
  });
  const openCountFor = (idx: number) =>
    (issueCountQueries[idx]?.data ?? []).filter((i) => i.status !== "DONE").length;

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    if (href === "/app/orgs") return pathname === "/app/orgs";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const dashboardHref = orgId ? `/app/orgs/${orgId}` : "/app/orgs";

  return (
    <aside
      className="border-border flex h-screen w-[230px] shrink-0 flex-col border-r p-2.5"
      style={{ background: "var(--bg-grad)" }}
    >
      {/* org switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="hover:bg-hover mb-2.5 flex h-11 w-full items-center gap-2.5 rounded-[10px] px-2 transition-colors">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg shadow-sm">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start">
              {orgsLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : currentOrg ? (
                <>
                  <span className="font-display text-[14px] font-bold leading-tight tracking-tight">
                    {currentOrg.name}
                  </span>
                  <span className="text-text-faint font-mono text-[10.5px] leading-tight">{currentOrg.slug}</span>
                </>
              ) : (
                <span className="font-display text-[14px] font-bold">Select org</span>
              )}
            </div>
            <ChevronsUpDown className="text-text-faint h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations?.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => onOrgChange?.(org.id)}
              className={org.id === orgId ? "bg-accent/10" : ""}
            >
              <Building2 className="mr-2 h-4 w-4" />
              {org.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreateOrg}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* search / ⌘K trigger */}
      <button
        onClick={openCommandPalette}
        className="bg-card border-border text-text-faint mb-3 flex h-8 w-full items-center gap-2 rounded-md border px-2.5 text-[12.5px]"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <span className="bg-surface-3 text-text-muted border-border rounded border px-1 font-mono text-[10px] font-semibold">
          ⌘K
        </span>
      </button>

      {/* main nav */}
      <nav className="flex flex-col gap-px">
        <NavItem href={dashboardHref} icon={LayoutDashboard} label="Dashboard" active={isActive(dashboardHref, true)} />
        <NavItem href="/app/orgs" icon={Building2} label="Organizations" active={isActive("/app/orgs")} />
        <NavItem href="/app/invites" icon={Inbox} label="My Invites" active={isActive("/app/invites")} />
      </nav>

      {/* projects section */}
      {orgId && (
        <>
          <div className="h-4" />
          <SectionLabel
            action={
              <Link
                href={`/app/orgs/${orgId}/projects?create=true`}
                className="text-text-muted hover:bg-hover grid h-[18px] w-[18px] place-items-center rounded"
              >
                <Plus className="h-3 w-3" />
              </Link>
            }
          >
            Projects
          </SectionLabel>
          <div className="flex flex-col gap-px">
            {(projects ?? []).length === 0 && (
              <span className="text-text-faint px-2.5 py-1 text-[12px]">No projects yet</span>
            )}
            {(projects ?? []).map((p, idx) => {
              const href = `/app/orgs/${orgId}/projects/${p.id}`;
              const active = pathname.startsWith(href);
              const hue = PROJECT_HUES[idx % PROJECT_HUES.length];
              return (
                <Link
                  key={p.id}
                  href={href}
                  className="flex h-[30px] items-center gap-2.5 rounded-md px-2.5 text-[12.5px] transition-colors"
                  style={{
                    color: active ? "var(--foreground)" : "var(--text-2)",
                    background: active ? "var(--surface-3)" : "transparent",
                    fontWeight: active ? 600 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "var(--hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-[3px]"
                    style={{ background: `oklch(0.62 0.16 ${hue})` }}
                  />
                  <span className="flex-1 truncate text-left">{p.name}</span>
                  <span className="text-text-faint font-mono text-[10.5px]">{openCountFor(idx) || ""}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* secondary nav */}
      {orgId && (
        <nav className="mb-1.5 flex flex-col gap-px">
          <NavItem href={`/app/orgs/${orgId}/members`} icon={Users} label="Members" active={isActive(`/app/orgs/${orgId}/members`)} />
          <NavItem href={`/app/orgs/${orgId}/invites`} icon={Mail} label="Invites" active={isActive(`/app/orgs/${orgId}/invites`)} />
          <NavItem href={`/app/orgs/${orgId}/settings`} icon={Settings} label="Settings" active={isActive(`/app/orgs/${orgId}/settings`)} />
          <NavItem href="/docs" icon={FileText} label="Docs" active={isActive("/docs")} />
        </nav>
      )}
      {!orgId && (
        <nav className="mb-1.5 flex flex-col gap-px">
          <NavItem href="/docs" icon={FileText} label="Docs" active={isActive("/docs")} />
        </nav>
      )}

      {/* user block */}
      <div className="border-border -mx-2.5 mb-1.5 border-t" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="hover:bg-hover flex h-10 w-full items-center gap-2.5 rounded-[10px] px-1.5 transition-colors">
            <WorklyAvatar name={user?.name ?? null} size={26} />
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <span className="text-[12.5px] font-semibold leading-tight">{user?.name || "User"}</span>
              <span className="text-text-faint truncate text-[10.5px] leading-tight">{user?.email}</span>
            </div>
            <ChevronsUpDown className="text-text-faint h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/app/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
}
