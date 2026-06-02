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
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

// Column types
export interface ColumnResponse {
  id: number;
  boardId: number;
  name: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColumnRequest {
  name: string;
}

export interface UpdateColumnRequest {
  name?: string;
  orderIndex?: number;
}

// Label types
export interface LabelResponse {
  id: number;
  projectId: number;
  name: string;
  color: string;
  createdAt: string;
}

// Sprint types
export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface SprintResponse {
  id: number;
  projectId: number;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  issueCount: number;
  pointsTotal: number;
  pointsDone: number;
  createdAt: string;
  updatedAt: string;
}

// Subtask types
export interface SubtaskResponse {
  id: number;
  issueId: number;
  title: string;
  done: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

// Activity feed types
export type ActivityType =
  | "ISSUE_CREATED"
  | "ISSUE_MOVED"
  | "ISSUE_ASSIGNED"
  | "ISSUE_COMMENTED"
  | "ISSUE_COMPLETED"
  | "ISSUE_REOPENED";

export interface ActivityResponse {
  id: number;
  projectId: number;
  type: ActivityType;
  actorId: number;
  actorName: string;
  issueId: number | null;
  targetTitle: string | null;
  meta: string | null;
  createdAt: string;
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
  columnId: number;
  projectId: number;
  reporterId: number;
  assigneeId: number | null;
  orderIndex: number;
  storyPoints: number | null;
  dueDate: string | null;
  sprintId: number | null;
  labels: LabelResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  priority: Priority;
  status?: IssueStatus;
  columnId: number;
  assigneeId?: number;
  storyPoints?: number;
  dueDate?: string;
  sprintId?: number;
  labelIds?: number[];
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: IssueStatus;
  columnId?: number;
  assigneeId?: number;
  storyPoints?: number;
  clearStoryPoints?: boolean;
  dueDate?: string;
  clearDueDate?: boolean;
  sprintId?: number;
  clearSprint?: boolean;
  labelIds?: number[];
}

export interface MoveIssueRequest {
  columnId: number;
  status?: IssueStatus;
  beforeIssueId?: number;
  afterIssueId?: number;
}
