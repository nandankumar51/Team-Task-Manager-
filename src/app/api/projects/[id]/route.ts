import { Role } from "@prisma/client";
import { ApiError, handleApiError, jsonOk, readJson } from "@/lib/api";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/rbac";
import { projectPatchSchema } from "@/lib/validations";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Params) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    await assertProjectAccess(user, id);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true, workspaceId: true }
        },
        members: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, workspaceId: true }
            }
          }
        },
        invitations: {
          where: user.role === Role.ADMIN ? { acceptedAt: null } : { id: "__no_pending_invites_for_members__" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            role: true,
            acceptedAt: true,
            createdAt: true
          }
        },
        tasks: {
          where: user.role === Role.ADMIN ? {} : { assignedToId: user.id },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, role: true, workspaceId: true }
            },
            createdBy: {
              select: { id: true, name: true, email: true, role: true, workspaceId: true }
            }
          }
        }
      }
    });

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    return jsonOk({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: Params) {
  try {
    const user = await requireAuth();
    requireAdmin(user);
    const { id } = await context.params;
    await assertProjectAccess(user, id);
    const body = projectPatchSchema.parse(await readJson(request));

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {})
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true, workspaceId: true }
        },
        _count: {
          select: { members: true, tasks: true }
        }
      }
    });

    return jsonOk({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    const user = await requireAuth();
    requireAdmin(user);
    const { id } = await context.params;
    await assertProjectAccess(user, id);

    await prisma.project.delete({
      where: { id }
    });

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
