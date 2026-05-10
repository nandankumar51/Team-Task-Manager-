"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, UserPlus } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadges";
import { Alert, Button, Card, EmptyState, Field, Input, LoadingBlock, Modal, Select, Textarea } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/client-api";
import { formatDate, isOverdue } from "@/lib/format";
import { ProjectDetail, Task, TaskPriority, TaskStatus, User } from "@/types";

type TaskFormState = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedToId: string;
};

const statusOptions: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const priorityOptions: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

const blankTaskForm: TaskFormState = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: defaultDueDate(),
  assignedToId: ""
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [taskForm, setTaskForm] = useState<TaskFormState>(blankTaskForm);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const memberUsers = project?.members.map((member) => member.user) ?? [];

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const projectResponse = await apiFetch<{ project: ProjectDetail }>(`/api/projects/${projectId}`);
      setProject(projectResponse.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load project.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (user) {
      void loadProject();
    }
  }, [loadProject, user]);

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!memberEmail) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    setInviteLink("");

    try {
      const response = await apiFetch<{ emailSent?: boolean; inviteUrl?: string; member?: unknown }>(`/api/projects/${projectId}/members`, {
        method: "POST",
        json: { email: memberEmail }
      });
      setMemberEmail("");
      await loadProject();
      setInviteLink(response.inviteUrl ?? "");
      setNotice(
        response.member
          ? "Existing workspace user added to the project."
          : response.emailSent
            ? "Invitation email sent."
            : "Invitation saved. Email is not configured, so share the invite link below."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add member.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(member: User) {
    if (!window.confirm(`Remove ${member.name} from this project? Their tasks in this project will be unassigned.`)) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiFetch(`/api/projects/${projectId}/members/${member.id}`, { method: "DELETE" });
      await loadProject();
      setNotice("Member removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove member.");
    } finally {
      setSaving(false);
    }
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        json: {
          ...taskForm,
          projectId,
          assignedToId: taskForm.assignedToId || null
        }
      });
      setTaskForm({ ...blankTaskForm, dueDate: defaultDueDate() });
      setTaskModalOpen(false);
      await loadProject();
      setNotice("Task created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTaskStatus(task: Task, status: TaskStatus) {
    setError("");
    setNotice("");

    try {
      const data = await apiFetch<{ task: Task }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        json: { status }
      });
      setProject((current) =>
        current
          ? {
              ...current,
              tasks: current.tasks.map((item) => (item.id === task.id ? data.task : item))
            }
          : current
      );
      setNotice("Task status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task status.");
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
      </div>

      {error ? <Alert message={error} /> : null}
      {notice ? <Alert message={notice} tone="success" /> : null}
      {inviteLink ? (
        <div className="rounded-md border border-line bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="font-bold text-ink">Invite link:</span>{" "}
          <a className="break-all font-semibold text-brand-600 hover:text-brand-700" href={inviteLink}>
            {inviteLink}
          </a>
        </div>
      ) : null}

      {loading ? (
        <LoadingBlock label="Loading project" />
      ) : !project ? (
        <EmptyState title="Project unavailable" description="The project could not be found or you do not have access." />
      ) : (
        <>
          <div className="relative overflow-hidden rounded-lg border border-white/70 bg-white/90 p-6 shadow-card backdrop-blur sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb,#0891b2)]" />
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                  Project workspace
                </div>
                <h1 className="text-3xl font-black tracking-tight text-ink">{project.name}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{project.description || "No description added."}</p>
              </div>
              {user?.role === "ADMIN" ? (
                <Button type="button" onClick={() => setTaskModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New task
                </Button>
              ) : null}
            </div>
          </div>

          <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <div className="grid gap-6">
              <Card className="p-5">
                <h2 className="font-bold text-ink">Project members</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">People with access to this project.</p>
                <div className="mt-4 grid gap-3">
                  {project.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-line bg-slate-50/80 p-3 transition hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-brand-700 ring-1 ring-line">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-ink">{member.user.name}</div>
                        <div className="truncate text-xs text-slate-500">{member.user.email}</div>
                        </div>
                      </div>
                      {user?.role === "ADMIN" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-9 px-2"
                          disabled={saving}
                          onClick={() => void removeMember(member.user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>

                {user?.role === "ADMIN" ? (
                  <form className="mt-5 grid gap-3 border-t border-line pt-4" onSubmit={(event) => void addMember(event)}>
                    <Field label="Invite member by email">
                      <Input
                        type="email"
                        value={memberEmail}
                        placeholder="teammate@example.com"
                        onChange={(event) => setMemberEmail(event.target.value)}
                      />
                    </Field>
                    <Button type="submit" disabled={saving || !memberEmail}>
                      <UserPlus className="h-4 w-4" />
                      Send invite
                    </Button>
                  </form>
                ) : null}

                {user?.role === "ADMIN" && project.invitations && project.invitations.length > 0 ? (
                  <div className="mt-5 border-t border-line pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Pending invites</h3>
                    <div className="mt-3 grid gap-2">
                      {project.invitations.map((invite) => (
                        <div key={invite.id} className="rounded-md border border-dashed border-line bg-white px-3 py-2 text-sm text-slate-600">
                          {invite.email}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="border-b border-line bg-slate-50/70 px-5 py-4">
                <h2 className="font-bold text-ink">Project tasks</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {user?.role === "ADMIN" ? "All tasks in this project." : "Tasks assigned to you in this project."}
                </p>
              </div>

              {project.tasks.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="No tasks here"
                    description={
                      user?.role === "ADMIN"
                        ? "Create a project task and assign it to a member."
                        : "Assigned tasks for this project will appear here."
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-line text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Task</th>
                        <th className="px-5 py-3">Assign to</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Priority</th>
                        <th className="px-5 py-3">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white">
                      {project.tasks.map((task) => (
                        <tr key={task.id} className="transition hover:bg-slate-50/70">
                          <td className="max-w-sm px-5 py-4">
                            <div className="font-semibold text-ink">{task.title}</div>
                            {task.description ? <div className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</div> : null}
                          </td>
                          <td className="px-5 py-4 text-slate-600">{task.assignedTo?.name ?? "Unassigned"}</td>
                          <td className="px-5 py-4">
                            {user?.role === "MEMBER" && task.assignedToId === user.id ? (
                              <Select
                                value={task.status}
                                onChange={(event) => void updateTaskStatus(task, event.target.value as TaskStatus)}
                                className="min-w-36"
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status.replace("_", " ")}
                                  </option>
                                ))}
                              </Select>
                            ) : (
                              <StatusBadge status={task.status} />
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          <td className="px-5 py-4">
                            <span className={isOverdue(task.dueDate, task.status) ? "font-semibold text-danger-700" : "text-slate-600"}>
                              {formatDate(task.dueDate)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </section>
        </>
      )}

      {taskModalOpen ? (
        <Modal title="Create task" onClose={() => setTaskModalOpen(false)}>
          <form className="grid gap-4" onSubmit={(event) => void createTask(event)}>
            <Field label="Task title">
              <Input value={taskForm.title} onChange={(event) => setTaskForm((value) => ({ ...value, title: event.target.value }))} required />
            </Field>
            <Field label="Description">
              <Textarea
                value={taskForm.description}
                onChange={(event) => setTaskForm((value) => ({ ...value, description: event.target.value }))}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assign to">
                <Select
                  value={taskForm.assignedToId}
                  onChange={(event) => setTaskForm((value) => ({ ...value, assignedToId: event.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {memberUsers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Due date">
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm((value) => ({ ...value, dueDate: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Status">
                <Select value={taskForm.status} onChange={(event) => setTaskForm((value) => ({ ...value, status: event.target.value as TaskStatus }))}>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Priority">
                <Select
                  value={taskForm.priority}
                  onChange={(event) => setTaskForm((value) => ({ ...value, priority: event.target.value as TaskPriority }))}
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating" : "Create task"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
