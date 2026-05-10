export type Role = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId?: string;
  workspace?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  _count?: {
    members: number;
    tasks: number;
  };
};

export type InvitationResult = {
  email: string;
  emailSent: boolean;
  inviteUrl?: string;
  member?: ProjectMember;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  createdAt: string;
  user: User;
};

export type Invitation = {
  id: string;
  email: string;
  role: Role;
  acceptedAt: string | null;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  projectId: string;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  assignedTo?: User | null;
  createdBy?: User;
};

export type ProjectDetail = ProjectSummary & {
  members: ProjectMember[];
  invitations?: Invitation[];
  tasks: Task[];
};

export type DashboardData = {
  totalProjects: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  myTasks: number;
  recentTasks: Task[];
};
