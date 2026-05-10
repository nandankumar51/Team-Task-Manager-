import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { ApiError, handleApiError, jsonCreated, readJson } from "@/lib/api";
import { setSessionCookie, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await readJson(request));
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true }
    });

    if (existing) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const pendingInvites = await prisma.invitation.findMany({
      where: {
        email: body.email,
        acceptedAt: null
      },
      orderBy: {
        createdAt: "asc"
      },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    });

    let targetWorkspace: { id: string; name: string } | null = null;

    if (body.role === Role.MEMBER && pendingInvites.length === 0) {
      if (!body.adminEmail) {
        throw new ApiError(400, "Enter the admin email for the workspace you want to join.");
      }

      if (body.adminEmail === body.email) {
        throw new ApiError(400, "Use the workspace admin's email, not your own email.");
      }

      const admin = await prisma.user.findFirst({
        where: {
          email: body.adminEmail,
          role: Role.ADMIN
        },
        select: {
          workspace: {
            select: { id: true, name: true }
          }
        }
      });

      if (!admin?.workspace) {
        throw new ApiError(404, "No admin workspace was found for that email.");
      }

      targetWorkspace = admin.workspace;
    }

    const user = await prisma.$transaction(async (tx) => {
      if (body.role === Role.MEMBER && pendingInvites.length > 0) {
        const workspace = pendingInvites[0].workspace;
        const workspaceInvites = pendingInvites.filter((invite) => invite.workspaceId === workspace.id);
        const createdUser = await tx.user.create({
          data: {
            name: body.name,
            email: body.email,
            passwordHash,
            role: Role.MEMBER,
            workspaceId: workspace.id,
            projectMemberships: {
              create: workspaceInvites.map((invite) => ({
                projectId: invite.projectId
              }))
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            workspaceId: true,
            workspace: {
              select: { id: true, name: true }
            }
          }
        });

        await tx.invitation.updateMany({
          where: {
            id: {
              in: workspaceInvites.map((invite) => invite.id)
            }
          },
          data: {
            acceptedAt: new Date()
          }
        });

        return createdUser;
      }

      if (body.role === Role.MEMBER) {
        if (!targetWorkspace) {
          throw new ApiError(400, "Members need an invite or a valid admin email to join a workspace.");
        }

        return tx.user.create({
          data: {
            name: body.name,
            email: body.email,
            passwordHash,
            role: Role.MEMBER,
            workspaceId: targetWorkspace.id
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            workspaceId: true,
            workspace: {
              select: { id: true, name: true }
            }
          }
        });
      }

      const workspace = await tx.workspace.create({
        data: {
          name: `${body.name}'s Workspace`
        }
      });

      return tx.user.create({
        data: {
          name: body.name,
          email: body.email,
          passwordHash,
          role: Role.ADMIN,
          workspaceId: workspace.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          workspaceId: true,
          workspace: {
            select: { id: true, name: true }
          }
        }
      });
    });

    await setSessionCookie(user);
    return jsonCreated({ user: toSafeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
