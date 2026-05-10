import { ApiError, handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/rbac";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string; userId: string }>;
};

export async function DELETE(_request: Request, context: Params) {
  try {
    const user = await requireAuth();
    requireAdmin(user);
    const { id, userId } = await context.params;
    await assertProjectAccess(user, id);

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId
        }
      }
    });

    if (!membership) {
      throw new ApiError(404, "Project member not found.");
    }

    await prisma.$transaction([
      prisma.task.updateMany({
        where: {
          projectId: id,
          assignedToId: userId
        },
        data: {
          assignedToId: null
        }
      }),
      prisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: id,
            userId
          }
        }
      })
    ]);

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
