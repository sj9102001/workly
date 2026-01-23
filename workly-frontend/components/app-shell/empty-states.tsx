"use client";

import { Building2, FolderKanban, Users, Mail, LayoutGrid, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
      {icon && <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">{icon}</div>}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

export function NoOrganizations({ onCreateOrg }: { onCreateOrg: () => void }) {
  return (
    <EmptyState
      icon={<Building2 className="h-8 w-8" />}
      title="No organizations yet"
      description="Create your first organization to start managing projects and collaborating with your team."
      action={{ label: "Create Organization", onClick: onCreateOrg }}
    />
  );
}

export function NoProjects({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <EmptyState
      icon={<FolderKanban className="h-8 w-8" />}
      title="No projects yet"
      description="Create your first project to start organizing your work into boards and issues."
      action={{ label: "Create Project", onClick: onCreateProject }}
    />
  );
}

export function NoMembers() {
  return (
    <EmptyState
      icon={<Users className="h-8 w-8" />}
      title="No members yet"
      description="Invite team members to collaborate on your organization's projects."
    />
  );
}

export function NoInvites({ onCreateInvite }: { onCreateInvite: () => void }) {
  return (
    <EmptyState
      icon={<Mail className="h-8 w-8" />}
      title="No pending invites"
      description="Send invitations to add new members to your organization."
      action={{ label: "Send Invite", onClick: onCreateInvite }}
    />
  );
}

export function NoBoards({ onCreateBoard }: { onCreateBoard: () => void }) {
  return (
    <EmptyState
      icon={<LayoutGrid className="h-8 w-8" />}
      title="No boards yet"
      description="Create a board to organize your issues into columns and track progress."
      action={{ label: "Create Board", onClick: onCreateBoard }}
    />
  );
}

export function NoIssues({ onCreateIssue }: { onCreateIssue: () => void }) {
  return (
    <EmptyState
      icon={<CheckSquare className="h-8 w-8" />}
      title="No issues yet"
      description="Create your first issue to start tracking work in this project."
      action={{ label: "Create Issue", onClick: onCreateIssue }}
    />
  );
}
