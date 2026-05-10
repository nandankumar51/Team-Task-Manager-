import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const users = await prisma.user.findMany({
      where: {
        workspaceId: user.workspaceId
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return jsonOk({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
