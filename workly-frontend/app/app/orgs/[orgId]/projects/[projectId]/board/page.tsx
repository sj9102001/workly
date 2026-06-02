"use client";

import React, { Suspense } from "react";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { KanbanSkeleton } from "@/components/app-shell/skeletons";
import { KanbanBoard } from "@/components/kanban-board";
import { useOrganization, useProject } from "@/hooks/use-queries";

function KanbanBoardContent({ orgId, projectId }: { orgId: string; projectId: string }) {
  const orgIdNum = Number(orgId);
  const projectIdNum = Number(projectId);

  const { data: org } = useOrganization(orgIdNum);
  const { data: project } = useProject(orgIdNum, projectIdNum);

  return (
    <>
      <AppTopbar
        breadcrumbs={[
          { label: org?.name ?? "Organization", href: `/app/orgs/${orgId}` },
          { label: "Projects", href: `/app/orgs/${orgId}/projects` },
          { label: project?.name ?? "Board", href: `/app/orgs/${orgId}/projects/${projectId}` },
          { label: "Board" },
        ]}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <KanbanBoard orgId={orgIdNum} projectId={projectIdNum} />
      </div>
    </>
  );
}

export default function KanbanBoardPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const resolvedParams = React.use(params);
  return (
    <Suspense fallback={<KanbanSkeleton />}>
      <KanbanBoardContent orgId={resolvedParams.orgId} projectId={resolvedParams.projectId} />
    </Suspense>
  );
}
