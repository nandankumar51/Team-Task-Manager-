import { ApiError, handleApiError, jsonCreated, jsonOk, readJson } from "@/lib/api";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { buildInviteUrl, sendInvitationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/rbac";
import { projectMemberSchema } from "@/lib/validations";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

async function ensureProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, workspaceId: true, workspace: { select: { id: true, name: true } } }
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  return project;
}

export async function GET(_request: Request, context: Params) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    await ensureProject(id);
    await assertProjectAccess(user, id);

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, workspaceId: true }
        }
      }
    });

    return jsonOk({ members });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: Params) {
  try {
    const user = await requireAuth();
    requireAdmin(user);
    const { id } = await context.params;
    const project = await ensureProject(id);
    await assertProjectAccess(user, id);
    const body = projectMemberSchema.parse(await readJson(request));

    if (body.userId) {
      const targetUser = await prisma.user.findFirst({
        where: { id: body.userId, workspaceId: user.workspaceId },
        select: { id: true }
      });

      if (!targetUser) {
        throw new ApiError(404, "User not found in this workspace.");
      }

      const member = await prisma.projectMember.create({
        data: {
          projectId: id,
          userId: body.userId
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, workspaceId: true }
          }
        }
      });

      return jsonCreated({ member });
    }

    const email = body.email;

    if (!email) {
      throw new ApiError(400, "Email is required.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, workspaceId: true, name: true, email: true, role: true }
    });

    if (existingUser && existingUser.workspaceId !== user.workspaceId) {
      throw new ApiError(409, "This email already belongs to another workspace.");
    }

    if (existingUser) {
      const member = await prisma.projectMember.create({
        data: {
          projectId: id,
          userId: existingUser.id
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, workspaceId: true }
          }
        }
      });

      return jsonCreated({ member, emailSent: false, message: "Existing workspace user added to the project." });
    }

    const invitation = await prisma.invitation.upsert({
      where: {
        workspaceId_projectId_email: {
          workspaceId: user.workspaceId,
          projectId: id,
          email
        }
      },
      update: {
        acceptedAt: null,
        invitedById: user.id
      },
      create: {
        email,
        workspaceId: user.workspaceId,
        projectId: id,
        invitedById: user.id
      }
    });

    const inviteUrl = buildInviteUrl(email);
    const emailSent = await sendInvitationEmail({
      to: email,
      inviterName: user.name,
      workspaceName: project.workspace.name,
      projectName: project.name,
      inviteUrl
    });

    return jsonCreated({ invitation, emailSent, inviteUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
