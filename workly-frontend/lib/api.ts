// Build-time fallback. Used until the runtime /config value is fetched, and on
// the server during SSR. For "deploy anywhere without rebuilding", the runtime
// value from /config (backed by the server-side API_BASE_URL env var) wins.
const BUILD_TIME_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

let resolvedApiBaseUrl: string = BUILD_TIME_API_BASE_URL;
let apiBaseUrlPromise: Promise<string> | null = null;

/**
 * Resolves the backend base URL at runtime by querying the app's own /config
 * route once, then caching it. Falls back to the build-time value if /config
 * is unavailable. Safe to call repeatedly — only the first call hits the route.
 */
async function resolveApiBaseUrl(): Promise<string> {
  if (typeof window === "undefined") return BUILD_TIME_API_BASE_URL;
  if (apiBaseUrlPromise) return apiBaseUrlPromise;

  apiBaseUrlPromise = (async () => {
    try {
      const res = await fetch("/config", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.apiBaseUrl) {
          resolvedApiBaseUrl = data.apiBaseUrl;
        }
      }
    } catch {
      // Keep the build-time fallback if /config can't be reached.
    }
    return resolvedApiBaseUrl;
  })();

  return apiBaseUrlPromise;
}

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("accessToken");
  }
  return accessToken;
}

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

async function refreshToken(): Promise<boolean> {
  try {
    const baseUrl = await resolveApiBaseUrl();
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const baseUrl = await resolveApiBaseUrl();
  let response = await fetch(`${baseUrl}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  // If 401 and not a refresh/auth request, try to refresh token
  if (response.status === 401 && !skipAuth && !endpoint.includes("/auth/")) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;
      }
      response = await fetch(`${baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: "include",
      });
    } else {
      // Refresh failed, force logout
      setAccessToken(null);
      if (onUnauthorized) {
        onUnauthorized();
      }
      throw new ApiError(401, "Session expired");
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = "Request failed";
    try {
      const errorJson = JSON.parse(errorText);
      message = errorJson.message || errorJson.error || message;
    } catch {
      message = errorText || message;
    }
    throw new ApiError(response.status, message);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ accessToken: string; userId: number }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),

  register: (name: string, email: string, password: string, orgName: string) =>
    apiRequest<{ user: { id: number; name: string; email: string; createdAt: string; updatedAt: string }; organizationId: number; organizationSlug: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, orgName }),
      skipAuth: true,
    }),

  logout: () =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
    }),

  refresh: () =>
    apiRequest<{ accessToken: string; userId: number }>("/auth/refresh", {
      method: "POST",
      skipAuth: true,
    }),
};

// User API
export const userApi = {
  get: () => apiRequest<{ id: number; name: string; email: string; createdAt: string; updatedAt: string }>("/user"),
  update: (data: { name?: string; email?: string; password?: string }) =>
    apiRequest<{ id: number; name: string; email: string; createdAt: string; updatedAt: string }>("/user", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: () =>
    apiRequest<void>("/user", {
      method: "DELETE",
    }),
};

// Organization API
export const orgApi = {
  list: () => apiRequest<{ id: number; name: string; slug: string; createdAt: string }[]>("/orgs"),
  get: (orgId: number) => apiRequest<{ id: number; name: string; slug: string; createdAt: string }>(`/orgs/${orgId}`),
  create: (name: string) =>
    apiRequest<{ id: number; name: string; slug: string; createdAt: string }>("/orgs", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  update: (orgId: number, data: { name?: string }) =>
    apiRequest<{ id: number; name: string; slug: string; createdAt: string }>(`/orgs/${orgId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (orgId: number) =>
    apiRequest<void>(`/orgs/${orgId}`, {
      method: "DELETE",
    }),
  getMembers: (orgId: number) =>
    apiRequest<{ id: number; userId: number; userName: string; userEmail: string; role: string; createdAt: string }[]>(`/orgs/${orgId}/members`),
};

// Current user's invites (invites sent to me)
export type MyInvite = {
  id: number;
  orgId: number;
  orgName: string;
  invitedRole: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  token: string;
  acceptUrl: string;
};

// Invite API
export const inviteApi = {
  myInvites: () =>
    apiRequest<MyInvite[]>(`/me/invites`),
  list: (orgId: number) =>
    apiRequest<{ id: number; orgId: number; invitedEmail: string; invitedRole: string; status: string; token: string; expiresAt: string; createdAt: string }[]>(`/orgs/${orgId}/invites`),
  create: (orgId: number, email: string, role: string) =>
    apiRequest<{ id: number; orgId: number; invitedEmail: string; invitedRole: string; status: string; token: string; expiresAt: string; createdAt: string }>(`/orgs/${orgId}/invites`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),
  accept: (token: string) =>
    apiRequest<void>(`/invites/${token}/accept`, {
      method: "POST",
    }),
  decline: (token: string) =>
    apiRequest<void>(`/invites/${token}/decline`, {
      method: "POST",
    }),
  revoke: (inviteId: number) =>
    apiRequest<void>(`/invites/${inviteId}/revoke`, {
      method: "POST",
    }),
};

// Project API
export const projectApi = {
  list: (orgId: number) =>
    apiRequest<{ id: number; orgId: number; name: string; slug: string; createdAt: string; updatedAt: string }[]>(`/orgs/${orgId}/projects`),
  get: (orgId: number, projectId: number) =>
    apiRequest<{ id: number; orgId: number; name: string; slug: string; createdAt: string; updatedAt: string }>(`/orgs/${orgId}/projects/${projectId}`),
  create: (orgId: number, name: string) =>
    apiRequest<{ id: number; orgId: number; name: string; slug: string; createdAt: string; updatedAt: string }>(`/orgs/${orgId}/projects`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  update: (orgId: number, projectId: number, data: { name?: string }) =>
    apiRequest<{ id: number; orgId: number; name: string; slug: string; createdAt: string; updatedAt: string }>(`/orgs/${orgId}/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (orgId: number, projectId: number) =>
    apiRequest<void>(`/orgs/${orgId}/projects/${projectId}`, {
      method: "DELETE",
    }),
  getMembers: (orgId: number, projectId: number) =>
    apiRequest<{ id: number; userId: number; userName: string; userEmail: string; role: string; createdAt: string }[]>(`/orgs/${orgId}/projects/${projectId}/members`),
  addMember: (orgId: number, projectId: number, userId: number, role: string) =>
    apiRequest<{ id: number; userId: number; userName: string; userEmail: string; role: string; createdAt: string }>(`/orgs/${orgId}/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId, role }),
    }),
  removeMember: (orgId: number, projectId: number, userId: number) =>
    apiRequest<void>(`/orgs/${orgId}/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    }),
};

// Board API
export const boardApi = {
  get: (orgId: number, projectId: number) =>
    apiRequest<{ id: number; projectId: number; createdAt: string; updatedAt: string }>(`/orgs/${orgId}/projects/${projectId}/board`),
};

// Column API
export const columnApi = {
  list: (orgId: number, projectId: number) =>
    apiRequest<{ id: number; boardId: number; name: string; orderIndex: number; createdAt: string; updatedAt: string }[]>(`/orgs/${orgId}/projects/${projectId}/columns`),
  create: (orgId: number, projectId: number, name: string) =>
    apiRequest<{ id: number; boardId: number; name: string; orderIndex: number; createdAt: string; updatedAt: string }>(`/orgs/${orgId}/projects/${projectId}/columns`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  update: (orgId: number, projectId: number, columnId: number, data: { name?: string; orderIndex?: number }) =>
    apiRequest<{ id: number; boardId: number; name: string; orderIndex: number; createdAt: string; updatedAt: string }>(`/orgs/${orgId}/projects/${projectId}/columns/${columnId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (orgId: number, projectId: number, columnId: number) =>
    apiRequest<void>(`/orgs/${orgId}/projects/${projectId}/columns/${columnId}`, {
      method: "DELETE",
    }),
};

// Issue API
import type {
  IssueResponse,
  CreateIssueRequest,
  UpdateIssueRequest,
  MoveIssueRequest,
  LabelResponse,
  SprintResponse,
  SubtaskResponse,
  ActivityResponse,
} from "@/lib/types";

export const issueApi = {
  list: (orgId: number, projectId: number, params?: { columnId?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.columnId) searchParams.set("columnId", String(params.columnId));
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return apiRequest<IssueResponse[]>(
      `/orgs/${orgId}/projects/${projectId}/issues${query ? `?${query}` : ""}`
    );
  },
  get: (orgId: number, projectId: number, issueId: number) =>
    apiRequest<IssueResponse>(`/orgs/${orgId}/projects/${projectId}/issues/${issueId}`),
  create: (orgId: number, projectId: number, data: CreateIssueRequest) =>
    apiRequest<IssueResponse>(`/orgs/${orgId}/projects/${projectId}/issues`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (orgId: number, projectId: number, issueId: number, data: UpdateIssueRequest) =>
    apiRequest<IssueResponse>(`/orgs/${orgId}/projects/${projectId}/issues/${issueId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  move: (orgId: number, projectId: number, issueId: number, data: MoveIssueRequest) =>
    apiRequest<IssueResponse>(`/orgs/${orgId}/projects/${projectId}/issues/${issueId}/move`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Label API
export const labelApi = {
  list: (orgId: number, projectId: number) =>
    apiRequest<LabelResponse[]>(`/orgs/${orgId}/projects/${projectId}/labels`),
  create: (orgId: number, projectId: number, data: { name: string; color: string }) =>
    apiRequest<LabelResponse>(`/orgs/${orgId}/projects/${projectId}/labels`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (orgId: number, projectId: number, labelId: number, data: { name?: string; color?: string }) =>
    apiRequest<LabelResponse>(`/orgs/${orgId}/projects/${projectId}/labels/${labelId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (orgId: number, projectId: number, labelId: number) =>
    apiRequest<void>(`/orgs/${orgId}/projects/${projectId}/labels/${labelId}`, {
      method: "DELETE",
    }),
};

// Sprint API
export const sprintApi = {
  list: (orgId: number, projectId: number) =>
    apiRequest<SprintResponse[]>(`/orgs/${orgId}/projects/${projectId}/sprints`),
  active: (orgId: number, projectId: number) =>
    apiRequest<SprintResponse | null>(`/orgs/${orgId}/projects/${projectId}/sprints/active`),
  get: (orgId: number, projectId: number, sprintId: number) =>
    apiRequest<SprintResponse>(`/orgs/${orgId}/projects/${projectId}/sprints/${sprintId}`),
  create: (
    orgId: number,
    projectId: number,
    data: { name: string; goal?: string; startDate?: string; endDate?: string }
  ) =>
    apiRequest<SprintResponse>(`/orgs/${orgId}/projects/${projectId}/sprints`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (
    orgId: number,
    projectId: number,
    sprintId: number,
    data: { name?: string; goal?: string; status?: string; startDate?: string; endDate?: string }
  ) =>
    apiRequest<SprintResponse>(`/orgs/${orgId}/projects/${projectId}/sprints/${sprintId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (orgId: number, projectId: number, sprintId: number) =>
    apiRequest<void>(`/orgs/${orgId}/projects/${projectId}/sprints/${sprintId}`, {
      method: "DELETE",
    }),
};

// Subtask API
export const subtaskApi = {
  list: (orgId: number, projectId: number, issueId: number) =>
    apiRequest<SubtaskResponse[]>(
      `/orgs/${orgId}/projects/${projectId}/issues/${issueId}/subtasks`
    ),
  add: (orgId: number, projectId: number, issueId: number, title: string) =>
    apiRequest<SubtaskResponse>(
      `/orgs/${orgId}/projects/${projectId}/issues/${issueId}/subtasks`,
      { method: "POST", body: JSON.stringify({ title }) }
    ),
  update: (
    orgId: number,
    projectId: number,
    issueId: number,
    subtaskId: number,
    data: { title?: string; done?: boolean }
  ) =>
    apiRequest<SubtaskResponse>(
      `/orgs/${orgId}/projects/${projectId}/issues/${issueId}/subtasks/${subtaskId}`,
      { method: "PUT", body: JSON.stringify(data) }
    ),
  delete: (orgId: number, projectId: number, issueId: number, subtaskId: number) =>
    apiRequest<void>(
      `/orgs/${orgId}/projects/${projectId}/issues/${issueId}/subtasks/${subtaskId}`,
      { method: "DELETE" }
    ),
};

// Activity feed API
export const activityApi = {
  list: (orgId: number, projectId: number, limit = 20) =>
    apiRequest<ActivityResponse[]>(
      `/orgs/${orgId}/projects/${projectId}/activity?limit=${limit}`
    ),
};

// Issue comments API
export type IssueComment = {
  id: number;
  issueId: number;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: string;
};

export const commentApi = {
  list: (orgId: number, projectId: number, issueId: number) =>
    apiRequest<IssueComment[]>(
      `/orgs/${orgId}/projects/${projectId}/issues/${issueId}/comments`
    ),
  add: (orgId: number, projectId: number, issueId: number, body: string) =>
    apiRequest<IssueComment>(
      `/orgs/${orgId}/projects/${projectId}/issues/${issueId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ body }),
      }
    ),
  delete: (orgId: number, projectId: number, issueId: number, commentId: number) =>
    apiRequest<void>(
      `/orgs/${orgId}/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
      {
        method: "DELETE",
      }
    ),
};

// Notification API
export interface Notification {
  id: number;
  type: string;
  message: string;
  actionEvent?: string | null;
  actionPayload?: string | null;
  createdAt: string;
  readAt: string | null;
  read: boolean;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const notificationApi = {
  list: (page = 0, size = 5, unreadOnly = false) =>
    apiRequest<NotificationPage>(
      `/notifications?page=${page}&size=${size}&unreadOnly=${unreadOnly}`
    ),
  unreadCount: () => apiRequest<number>("/notifications/unread-count"),
  markAsRead: (id: number) =>
    apiRequest<void>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),
  markAllAsRead: () =>
    apiRequest<void>("/notifications/read-all", {
      method: "PATCH",
    }),
};
