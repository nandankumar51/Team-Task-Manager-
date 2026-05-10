import { Role } from "@prisma/client";
import { ApiError, handleApiError, jsonOk, readJson } from "@/lib/api";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertAssignableToProject, assertTaskAccess } from "@/lib/rbac";
import { taskAdminPatchSchema, taskMemberPatchSchema } from "@/lib/validations";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

const taskInclude = {
  project: {
    select: { id: true, name: true, workspaceId: true }
  },
  assignedTo: {
    select: { id: true, name: true, email: true, role: true, workspaceId: true }
  },
  createdBy: {
    select: { id: true, name: true, email: true, role: true, workspaceId: true }
  }
};

export async function GET(_request: Request, context: Params) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: taskInclude
    });

    if (!task) {
      throw new ApiError(404, "Task not found.");
    }

    if (task.project.workspaceId !== user.workspaceId) {
      throw new ApiError(403, "You do not have access to this task.");
    }

    assertTaskAccess(user, task);
    return jsonOk({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: Params) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { workspaceId: true }
        }
      }
    });

    if (!existingTask) {
      throw new ApiError(404, "Task not found.");
    }

    if (existingTask.project.workspaceId !== user.workspaceId) {
      throw new ApiError(403, "You do not have access to this task.");
    }

    if (user.role === Role.MEMBER) {
      assertTaskAccess(user, existingTask);
      const body = taskMemberPatchSchema.parse(await readJson(request));
      const task = await prisma.task.update({
        where: { id },
        data: { status: body.status },
        include: taskInclude
      });

      return jsonOk({ task });
    }

    requireAdmin(user);
    const body = taskAdminPatchSchema.parse(await readJson(request));
    const nextProjectId = body.projectId ?? existingTask.projectId;
    const nextAssignedToId =
      Object.prototype.hasOwnProperty.call(body, "assignedToId") ? body.assignedToId ?? null : existingTask.assignedToId;

    if (body.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: body.projectId },
        select: { id: true, workspaceId: true }
      });

      if (!project || project.workspaceId !== user.workspaceId) {
        throw new ApiError(404, "Project not found.");
      }
    }

    await assertAssignableToProject(nextProjectId, nextAssignedToId);

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.dueDate !== undefined ? { dueDate: new Date(body.dueDate) } : {}),
        ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
        ...(Object.prototype.hasOwnProperty.call(body, "assignedToId") ? { assignedToId: body.assignedToId || null } : {})
      },
      include: taskInclude
    });

    return jsonOk({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    const user = await requireAuth();
    requireAdmin(user);
    const { id } = await context.params;
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: {
        project: {
          select: { workspaceId: true }
        }
      }
    });

    if (!existingTask) {
      throw new ApiError(404, "Task not found.");
    }

    if (existingTask.project.workspaceId !== user.workspaceId) {
      throw new ApiError(403, "You do not have access to this task.");
    }

    await prisma.task.delete({
      where: { id }
    });

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
