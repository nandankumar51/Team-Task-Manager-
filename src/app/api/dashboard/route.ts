import { Prisma, Role, TaskStatus } from "@prisma/client";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuth();
    const projectWhere: Prisma.ProjectWhereInput =
      user.role === Role.ADMIN
        ? { workspaceId: user.workspaceId }
        : { workspaceId: user.workspaceId, members: { some: { userId: user.id } } };
    const taskWhere: Prisma.TaskWhereInput =
      user.role === Role.ADMIN
        ? { project: { workspaceId: user.workspaceId } }
        : { assignedToId: user.id, project: { workspaceId: user.workspaceId } };
    const overdueWhere: Prisma.TaskWhereInput = {
      ...taskWhere,
      dueDate: { lt: new Date() },
      status: { not: TaskStatus.DONE }
    };

    const [
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      myTasks,
      recentTasks
    ] = await Promise.all([
      prisma.project.count({ where: projectWhere }),
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: TaskStatus.TODO } }),
      prisma.task.count({ where: { ...taskWhere, status: TaskStatus.IN_PROGRESS } }),
      prisma.task.count({ where: { ...taskWhere, status: TaskStatus.DONE } }),
      prisma.task.count({ where: overdueWhere }),
      prisma.task.count({ where: { assignedToId: user.id } }),
      prisma.task.findMany({
        where: taskWhere,
        take: 6,
        orderBy: { updatedAt: "desc" },
        include: {
          project: {
            select: { id: true, name: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true, workspaceId: true }
          }
        }
      })
    ]);

    return jsonOk({
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      myTasks,
      recentTasks
    });
  } catch (error) {
    return handleApiError(error);
  }
}
