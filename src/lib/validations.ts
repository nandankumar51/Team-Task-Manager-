import { z } from "zod";

const requiredText = (field: string) => z.string().trim().min(1, `${field} is required.`);
const roleSchema = z.enum(["ADMIN", "MEMBER"]);
const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email("Enter a valid email address.").toLowerCase().optional()
);

export const signupSchema = z.object({
  name: requiredText("Name").max(80, "Name must be 80 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: roleSchema.default("ADMIN"),
  adminEmail: optionalEmailSchema
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(1, "Password is required."),
  role: roleSchema.optional()
});

export const projectCreateSchema = z.object({
  name: requiredText("Project name").max(120, "Project name must be 120 characters or fewer."),
  description: z.string().trim().max(2000).optional().nullable()
});

export const projectPatchSchema = projectCreateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required."
});

export const projectMemberSchema = z
  .object({
    userId: z.string().trim().min(1).optional(),
    email: z.string().trim().email("Enter a valid email address.").toLowerCase().optional()
  })
  .refine((data) => Boolean(data.userId || data.email), {
    message: "User or email is required."
  });

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

const dueDateSchema = z
  .string()
  .trim()
  .min(1, "Due date is required.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Due date must be a valid date.");

export const taskCreateSchema = z.object({
  title: requiredText("Task title").max(160, "Task title must be 160 characters or fewer."),
  description: z.string().trim().max(3000).optional().nullable(),
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("MEDIUM"),
  dueDate: dueDateSchema,
  projectId: requiredText("Project"),
  assignedToId: z.string().trim().min(1).nullable().optional()
});

export const taskAdminPatchSchema = z
  .object({
    title: requiredText("Task title").max(160).optional(),
    description: z.string().trim().max(3000).nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: dueDateSchema.optional(),
    projectId: z.string().trim().min(1).optional(),
    assignedToId: z.string().trim().min(1).nullable().optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required."
  });

export const taskMemberPatchSchema = z
  .object({
    status: taskStatusSchema
  })
  .strict();

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  projectId: z.string().trim().min(1).optional(),
  overdue: z.enum(["true", "false"]).optional()
});
