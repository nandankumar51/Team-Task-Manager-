import { Role } from "@prisma/client";
import { handleApiError, jsonCreated, jsonOk, readJson } from "@/lib/api";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectCreateSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuth();
    const where =
      user.role === Role.ADMIN
        ? { workspaceId: user.workspaceId }
        : { workspaceId: user.workspaceId, members: { some: { userId: user.id } } };
    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true, workspaceId: true }
        },
        _count: {
          select: { members: true, tasks: true }
        }
      }
    });

    return jsonOk({ projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireAdmin(user);
    const body = projectCreateSchema.parse(await readJson(request));

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        workspaceId: user.workspaceId,
        createdById: user.id,
        members: {
          create: {
            userId: user.id
          }
        }
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

    return jsonCreated({ project });
  } catch (error) {
    return handleApiError(error);
  }
}
