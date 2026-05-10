import { Role, Task } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function assertProjectAccess(user: AuthUser, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true }
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  if (project.workspaceId !== user.workspaceId) {
    throw new ApiError(403, "You do not have access to this project.");
  }

  if (user.role === Role.ADMIN) {
    return;
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id
      }
    }
  });

  if (!membership) {
    throw new ApiError(403, "You do not have access to this project.");
  }
}

export function assertTaskAccess(user: AuthUser, task: Pick<Task, "assignedToId">) {
  if (user.role === Role.ADMIN) {
    return;
  }

  if (task.assignedToId !== user.id) {
    throw new ApiError(403, "You do not have access to this task.");
  }
}

export async function assertTaskWorkspaceAccess(user: AuthUser, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      assignedToId: true,
      project: {
        select: {
          workspaceId: true
        }
      }
    }
  });

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  if (task.project.workspaceId !== user.workspaceId) {
    throw new ApiError(403, "You do not have access to this task.");
  }

  assertTaskAccess(user, task);
}

export async function assertAssignableToProject(projectId: string, assignedToId: string | null | undefined) {
  if (!assignedToId) {
    return;
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: assignedToId
      }
    }
  });

  if (!membership) {
    throw new ApiError(400, "Tasks can only be assigned to members of the project.");
  }
}
