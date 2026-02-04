"use client";

import { Search, ChevronRight, Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { NotificationsModal } from "./notifications-modal";
import { ThemeToggle } from "./theme-toggle";
import { useUnreadNotificationCount } from "@/hooks/use-queries";
import { useAuth } from "@/lib/auth";

interface AppTopbarProps {
  breadcrumbs?: { label: string; href?: string }[];
}

export function AppTopbar({ breadcrumbs = [] }: AppTopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: unreadCount } = useUnreadNotificationCount(isAuthenticated);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />

        {breadcrumbs.length > 0 && (
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index < breadcrumbs.length - 1 ? (
                    <>
                      <BreadcrumbLink asChild>
                        <Link href={item.href || "#"}>{item.label}</Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </BreadcrumbSeparator>
                    </>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent bg-muted/50 text-muted-foreground hover:text-black hover:scale-105 hover:bg-muted hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {typeof unreadCount === "number" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white min-w-[18px] h-[18px]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}
          <ThemeToggle />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search..."
              className="h-9 w-64 pl-9 bg-muted/50 border-transparent focus:border-border transition-colors"
            />
          </div>
        </div>
      </header>

      <NotificationsModal open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </>
  );
}
