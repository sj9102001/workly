"use client";

import { Search, ChevronRight, Bell } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useState } from "react";
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
      <header className="border-border bg-background flex h-[52px] shrink-0 items-center gap-3 border-b px-4">
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
          {/* ⌘K search trigger — opens the global command palette */}
          <button
            type="button"
            onClick={() => {
              const ev = new KeyboardEvent("keydown", { key: "k", metaKey: true });
              window.dispatchEvent(ev);
            }}
            className="bg-card text-text-faint hover:border-border-strong flex h-9 w-56 items-center gap-2 rounded-md border px-2.5 text-[12.5px] transition-colors"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search or jump to…</span>
            <span className="bg-surface-3 text-text-muted border-border rounded border px-1.5 font-mono text-[10px] font-semibold">
              ⌘K
            </span>
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="text-text-2 hover:bg-hover hover:text-foreground relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {typeof unreadCount === "number" && unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <NotificationsModal open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </>
  );
}
