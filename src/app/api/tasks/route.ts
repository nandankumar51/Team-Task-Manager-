import { Prisma, Role } from "@prisma/client";
import { handleApiError, jsonCreated, jsonOk, readJson } from "@/lib/api";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertAssignableToProject } from "@/lib/rbac";
import { taskCreateSchema, taskFilterSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const filters = taskFilterSchema.parse({
      status: url.searchParams.get("status") || undefined,
      projectId: url.searchParams.get("projectId") || undefined,
      overdue: url.searchParams.get("overdue") || undefined
    });

    const where: Prisma.TaskWhereInput =
      user.role === Role.ADMIN
        ? { project: { workspaceId: user.workspaceId } }
        : { assignedToId: user.id, project: { workspaceId: user.workspaceId } };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.overdue === "true") {
      where.dueDate = { lt: new Date() };
      where.status = where.status ?? { not: "DONE" };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        project: {
          select: { id: true, name: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true, workspaceId: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true, workspaceId: true }
        }
      }
    });

    return jsonOk({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireAdmin(user);
    const body = taskCreateSchema.parse(await readJson(request));

    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { id: true, workspaceId: true }
    });

    if (!project || project.workspaceId !== user.workspaceId) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    await assertAssignableToProject(body.projectId, body.assignedToId);

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        status: body.status,
        priority: body.priority,
        dueDate: new Date(body.dueDate),
        projectId: body.projectId,
        assignedToId: body.assignedToId || null,
        createdById: user.id
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true, workspaceId: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true, workspaceId: true }
        }
      }
    });

    return jsonCreated({ task });
  } catch (error) {
    return handleApiError(error);
  }
}
