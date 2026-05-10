import bcrypt from "bcrypt";
import { PrismaClient, Role, TaskPriority, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  return date;
}

async function main() {
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const [adminHash, memberHash, alexHash] = await Promise.all([
    bcrypt.hash("Admin123!", 12),
    bcrypt.hash("Member123!", 12),
    bcrypt.hash("Alex123!", 12)
  ]);

  const workspace = await prisma.workspace.create({
    data: {
      name: "Avery's Workspace"
    }
  });

  const admin = await prisma.user.create({
    data: {
      name: "Avery Admin",
      email: "admin@example.com",
      passwordHash: adminHash,
      role: Role.ADMIN,
      workspaceId: workspace.id
    }
  });

  const member = await prisma.user.create({
    data: {
      name: "Mia Member",
      email: "member@example.com",
      passwordHash: memberHash,
      role: Role.MEMBER,
      workspaceId: workspace.id
    }
  });

  const alex = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "alex@example.com",
      passwordHash: alexHash,
      role: Role.MEMBER,
      workspaceId: workspace.id
    }
  });

  const launch = await prisma.project.create({
    data: {
      name: "Product Launch",
      description: "Coordinate the spring release from planning through post-launch reporting.",
      workspaceId: workspace.id,
      createdById: admin.id,
      members: {
        create: [{ userId: admin.id }, { userId: member.id }, { userId: alex.id }]
      }
    }
  });

  const ops = await prisma.project.create({
    data: {
      name: "Operations Refresh",
      description: "Improve weekly operating rituals, documentation, and internal service health.",
      workspaceId: workspace.id,
      createdById: admin.id,
      members: {
        create: [{ userId: admin.id }, { userId: member.id }]
      }
    }
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Draft launch checklist",
        description: "Collect owner, deadline, and dependency details for launch readiness.",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: daysFromNow(-8),
        projectId: launch.id,
        assignedToId: member.id,
        createdById: admin.id
      },
      {
        title: "Prepare campaign assets",
        description: "Finalize copy, social graphics, and partner launch snippets.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: daysFromNow(3),
        projectId: launch.id,
        assignedToId: alex.id,
        createdById: admin.id
      },
      {
        title: "QA onboarding flow",
        description: "Verify signup, invites, and first project setup on staging.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: daysFromNow(-2),
        projectId: launch.id,
        assignedToId: member.id,
        createdById: admin.id
      },
      {
        title: "Publish release notes",
        description: "Write customer-facing release notes and internal enablement summary.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: daysFromNow(5),
        projectId: launch.id,
        assignedToId: alex.id,
        createdById: admin.id
      },
      {
        title: "Launch analytics dashboard",
        description: "Define metrics and build first-pass launch adoption dashboard.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: daysFromNow(7),
        projectId: launch.id,
        assignedToId: member.id,
        createdById: admin.id
      },
      {
        title: "Audit recurring meetings",
        description: "Identify stale meetings and propose a cleaner operating cadence.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        dueDate: daysFromNow(-12),
        projectId: ops.id,
        assignedToId: member.id,
        createdById: admin.id
      },
      {
        title: "Refresh incident runbook",
        description: "Update escalation paths, severity definitions, and owner rotation.",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: daysFromNow(-1),
        projectId: ops.id,
        assignedToId: member.id,
        createdById: admin.id
      },
      {
        title: "Document weekly review",
        description: "Create a short template for project health review notes.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: daysFromNow(2),
        projectId: ops.id,
        assignedToId: member.id,
        createdById: admin.id
      },
      {
        title: "Backlog triage pass",
        description: "Group stale tickets by owner and recommend next actions.",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: daysFromNow(10),
        projectId: ops.id,
        assignedToId: null,
        createdById: admin.id
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed data created.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
