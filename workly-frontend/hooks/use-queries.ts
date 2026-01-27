"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgApi, projectApi, boardApi, columnApi, issueApi, inviteApi, notificationApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Organization hooks
export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => orgApi.list(),
  });
}

export function useOrganization(orgId: number | null) {
  return useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => orgApi.get(orgId!),
    enabled: !!orgId,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (name: string) => orgApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organization created", description: "Your new organization is ready." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: number; data: { name?: string } }) => orgApi.update(orgId, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organization updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (orgId: number) => orgApi.delete(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organization deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Organization members hooks
export function useOrgMembers(orgId: number | null) {
  return useQuery({
    queryKey: ["orgMembers", orgId],
    queryFn: () => orgApi.getMembers(orgId!),
    enabled: !!orgId,
  });
}

// Invite hooks
export function useInvites(orgId: number | null) {
  return useQuery({
    queryKey: ["invites", orgId],
    queryFn: () => inviteApi.list(orgId!),
    enabled: !!orgId,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, email, role }: { orgId: number; email: string; role: string }) =>
      inviteApi.create(orgId, email, role),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ["invites", orgId] });
      toast({ title: "Invite sent", description: "An invitation email has been sent." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ inviteId, orgId }: { inviteId: number; orgId: number }) => inviteApi.revoke(inviteId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ["invites", orgId] });
      toast({ title: "Invite revoked" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}


export function useAcceptInvite() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (token: string) => inviteApi.accept(token),
    onSuccess: () => {
      toast({ title: "Invite accepted", description: "You have joined the organization." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeclineInvite() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (token: string) => inviteApi.decline(token),
    onSuccess: () => {
      toast({ title: "Invite declined" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Project hooks
export function useProjects(orgId: number | null) {
  return useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => projectApi.list(orgId!),
    enabled: !!orgId,
  });
}

export function useProject(orgId: number | null, projectId: number | null) {
  return useQuery({
    queryKey: ["project", orgId, projectId],
    queryFn: () => projectApi.get(orgId!, projectId!),
    enabled: !!orgId && !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, name }: { orgId: number; name: string }) => projectApi.create(orgId, name),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
      toast({ title: "Project created", description: "Your new project is ready." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, projectId, data }: { orgId: number; projectId: number; data: { name?: string } }) =>
      projectApi.update(orgId, projectId, data),
    onSuccess: (_, { orgId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project", orgId, projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
      toast({ title: "Project updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, projectId }: { orgId: number; projectId: number }) => projectApi.delete(orgId, projectId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
      toast({ title: "Project deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Project members hooks
export function useProjectMembers(orgId: number | null, projectId: number | null) {
  return useQuery({
    queryKey: ["projectMembers", orgId, projectId],
    queryFn: () => projectApi.getMembers(orgId!, projectId!),
    enabled: !!orgId && !!projectId,
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, projectId, userId, role }: { orgId: number; projectId: number; userId: number; role: string }) =>
      projectApi.addMember(orgId, projectId, userId, role),
    onSuccess: (_, { orgId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", orgId, projectId] });
      toast({ title: "Member added" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, projectId, userId }: { orgId: number; projectId: number; userId: number }) =>
      projectApi.removeMember(orgId, projectId, userId),
    onSuccess: (_, { orgId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", orgId, projectId] });
      toast({ title: "Member removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Board hooks
export function useBoard(orgId: number | null, projectId: number | null) {
  return useQuery({
    queryKey: ["board", orgId, projectId],
    queryFn: () => boardApi.get(orgId!, projectId!),
    enabled: !!orgId && !!projectId,
  });
}

// Column hooks
export function useColumns(orgId: number | null, projectId: number | null) {
  return useQuery({
    queryKey: ["columns", orgId, projectId],
    queryFn: () => columnApi.list(orgId!, projectId!),
    enabled: !!orgId && !!projectId,
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, projectId, name }: { orgId: number; projectId: number; name: string }) =>
      columnApi.create(orgId, projectId, name),
    onSuccess: (_, { orgId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["columns", orgId, projectId] });
      toast({ title: "Column created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, projectId, columnId, data }: { orgId: number; projectId: number; columnId: number; data: { name?: string; orderIndex?: number } }) =>
      columnApi.update(orgId, projectId, columnId, data),
    onSuccess: (_, { orgId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["columns", orgId, projectId] });
      toast({ title: "Column updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orgId, projectId, columnId }: { orgId: number; projectId: number; columnId: number }) =>
      columnApi.delete(orgId, projectId, columnId),
    onSuccess: (_, { orgId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["columns", orgId, projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues", orgId, projectId] });
      toast({ title: "Column deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Issue hooks
export function useIssues(orgId: number | null, projectId: number | null, params?: { columnId?: number; status?: string }) {
  return useQuery({
    queryKey: ["issues", orgId, projectId, params],
    queryFn: () => issueApi.list(orgId!, projectId!, params),
    enabled: !!orgId && !!projectId,
  });
}

export function useIssue(orgId: number | null, projectId: number | null, issueId: number | null) {
  return useQuery({
    queryKey: ["issue", orgId, projectId, issueId],
    queryFn: () => issueApi.get(orgId!, projectId!, issueId!),
    enabled: !!orgId && !!projectId && !!issueId,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      orgId,
      projectId,
      data,
    }: {
      orgId: number;
      projectId: number;
      data: { title: string; description?: string; priority: string; status?: string; columnId: number; assigneeId?: number };
    }) => issueApi.create(orgId, projectId, data),
    onSuccess: (_, { orgId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["issues", orgId, projectId] });
      toast({ title: "Issue created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      orgId,
      projectId,
      issueId,
      data,
    }: {
      orgId: number;
      projectId: number;
      issueId: number;
      data: { title?: string; description?: string; priority?: string; status?: string; columnId?: number; assigneeId?: number };
    }) => issueApi.update(orgId, projectId, issueId, data),
    onSuccess: (_, { orgId, projectId, issueId }) => {
      queryClient.invalidateQueries({ queryKey: ["issue", orgId, projectId, issueId] });
      queryClient.invalidateQueries({ queryKey: ["issues", orgId, projectId] });
      toast({ title: "Issue updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useMoveIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      projectId,
      issueId,
      data,
    }: {
      orgId: number;
      projectId: number;
      issueId: number;
      data: { columnId: number; status?: string; beforeIssueId?: number; afterIssueId?: number };
    }) => issueApi.move(orgId, projectId, issueId, data),
    onSuccess: (_, { orgId, projectId, issueId }) => {
      queryClient.invalidateQueries({ queryKey: ["issue", orgId, projectId, issueId] });
      queryClient.invalidateQueries({ queryKey: ["issues", orgId, projectId] });
    },
  });
}

// Notification hooks
export function useNotifications(enabled: boolean, page = 0, size = 5, unreadOnly = false) {
  return useQuery({
    queryKey: ["notifications", { page, size, unreadOnly }],
    queryFn: () => notificationApi.list(page, size, unreadOnly),
    enabled,
  });
}

export function useUnreadNotificationCount(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: () => notificationApi.unreadCount(),
    enabled,
    refetchInterval: 60_000, // keep reasonably fresh
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] });
    },
  });
}
