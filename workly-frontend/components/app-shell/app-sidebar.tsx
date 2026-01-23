"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
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
  Palette,
} from "lucide-react";
import { useOrgTheme, themeColors } from "@/lib/org-theme";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useOrganizations } from "@/hooks/use-queries";

interface AppSidebarProps {
  currentOrgId?: number;
  onOrgChange?: (orgId: number) => void;
  onCreateOrg?: () => void;
}

export function AppSidebar({ currentOrgId, onOrgChange, onCreateOrg }: AppSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { user, logout } = useAuth();
  const { data: organizations, isLoading: orgsLoading } = useOrganizations();
  const { theme } = useOrgTheme();

  const orgId = currentOrgId || (params.orgId ? Number(params.orgId) : null);
  const currentOrg = organizations?.find((org) => org.id === orgId);
  
  // Get theme colors
  const primaryColor = themeColors[theme.primaryColor];

  const mainNavItems = [
    {
      title: "Dashboard",
      href: orgId ? `/app/orgs/${orgId}` : "/app/orgs",
      icon: LayoutDashboard,
    },
    {
      title: "Organizations",
      href: "/app/orgs",
      icon: Building2,
    },
  ];

  const orgNavItems = orgId
    ? [
        {
          title: "Projects",
          href: `/app/orgs/${orgId}/projects`,
          icon: FolderKanban,
        },
        {
          title: "Members",
          href: `/app/orgs/${orgId}/members`,
          icon: Users,
        },
        {
          title: "Invites",
          href: `/app/orgs/${orgId}/invites`,
          icon: Mail,
        },
      ]
    : [];

  const resourceItems = orgId ? [
    {
      title: "Settings",
      href: `/app/orgs/${orgId}/settings`,
      icon: Settings,
    },
    {
      title: "Theme",
      href: `/app/orgs/${orgId}/settings`,
      icon: Palette,
    },
    {
      title: "Docs",
      href: "/docs",
      icon: FileText,
    },
  ] : [
    {
      title: "Docs",
      href: "/docs",
      icon: FileText,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/app/orgs" && pathname === "/app/orgs") return true;
    if (href !== "/app/orgs" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors"
                    style={{ backgroundColor: primaryColor.primary }}
                  >
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-1 flex-col items-start text-sm">
                    {orgsLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : currentOrg ? (
                      <>
                        <span className="font-semibold">{currentOrg.name}</span>
                        <span className="text-xs text-muted-foreground">{currentOrg.slug}</span>
                      </>
                    ) : (
                      <span className="font-semibold">Select Organization</span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations?.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => onOrgChange?.(org.id)}
                    className={org.id === orgId ? "bg-accent" : ""}
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {orgNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Organization</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {orgNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start text-sm">
                    <span className="font-medium">{user?.name || "User"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
