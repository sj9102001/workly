export interface AuthResponse {
  accessToken: string;
  userId: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  orgName: string;
}

export interface CreateUserResponse {
  user: UserResponse;
  organizationId: number;
  organizationSlug: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Organization types
export interface OrganizationResponse {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
}

// Member types
export type OrgRole = "OWNER" | "ADMIN" | "MEMBER";
export type ProjectRole = "ADMIN" | "MEMBER";

export interface OrgMemberResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: OrgRole;
  createdAt: string;
}

export interface ProjectMemberResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: ProjectRole;
  createdAt: string;
}

export interface AddProjectMemberRequest {
  userId: number;
  role: ProjectRole;
}

// Invite types
export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED" | "EXPIRED";

export interface InviteResponse {
  id: number;
  orgId: number;
  invitedEmail: string;
  invitedRole: OrgRole;
  status: InviteStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInviteRequest {
  email: string;
  role: OrgRole;
}

export interface InviteDetailsResponse {
  organizationName: string;
  inviterName: string;
  email: string;
  role: OrgRole;
}

// Project types
export interface ProjectResponse {
  id: number;
  orgId: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
}

export interface UpdateProjectRequest {
  name?: string;
}

// Board types
export interface BoardResponse {
  id: number;
  name: string;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  name: string;
}

// Issue types
export type Priority = "HIGHEST" | "HIGH" | "MEDIUM" | "LOW" | "LOWEST";
export type IssueStatus = "TO_DO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export interface IssueResponse {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  status: IssueStatus;
  boardId: number | null;
  projectId: number;
  reporterId: number;
  assigneeId: number | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  priority: Priority;
  status?: IssueStatus;
  boardId?: number;
  assigneeId?: number;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: IssueStatus;
  boardId?: number;
  assigneeId?: number;
}

export interface MoveIssueRequest {
  status?: IssueStatus;
  boardId?: number;
  beforeIssueId?: number;
  afterIssueId?: number;
}
