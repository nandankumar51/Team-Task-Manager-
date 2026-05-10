import bcrypt from "bcrypt";
import { ApiError, handleApiError, jsonOk, readJson } from "@/lib/api";
import { setSessionCookie, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await readJson(request));
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const validPassword = await bcrypt.compare(body.password, user.passwordHash);

    if (!validPassword) {
      throw new ApiError(401, "Invalid email or password.");
    }

    if (body.role && user.role !== body.role) {
      throw new ApiError(403, "This account role does not match the selected login type.");
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
      workspace: user.workspace
    };

    await setSessionCookie(safeUser);
    return jsonOk({ user: toSafeUser(safeUser) });
  } catch (error) {
    return handleApiError(error);
  }
}
