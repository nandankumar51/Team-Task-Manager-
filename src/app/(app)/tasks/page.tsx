"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RotateCcw, Trash2 } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadges";
import { Alert, Button, Card, EmptyState, Field, Input, LoadingBlock, Modal, Select, Textarea } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/client-api";
import { formatDate, isOverdue } from "@/lib/format";
import { ProjectMember, ProjectSummary, Task, TaskPriority, TaskStatus } from "@/types";

const statusOptions: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const priorityOptions: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

type TaskFormState = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  projectId: string;
  assignedToId: string;
};

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function taskToForm(task: Task): TaskFormState {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    dueDate: new Date(task.dueDate).toISOString().slice(0, 10),
    projectId: task.projectId,
    assignedToId: task.assignedToId ?? ""
  };
}

function blankForm(projectId = ""): TaskFormState {
  return {
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: defaultDueDate(),
    projectId,
    assignedToId: ""
  };
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [filters, setFilters] = useState({
    status: "",
    projectId: "",
    overdue: false
  });
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(blankForm());
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const assignees = useMemo(() => projectMembers.map((member) => member.user), [projectMembers]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams();

    if (filters.status) {
      query.set("status", filters.status);
    }

    if (filters.projectId) {
      query.set("projectId", filters.projectId);
    }

    if (filters.overdue) {
      query.set("overdue", "true");
    }

    try {
      const data = await apiFetch<{ tasks: Task[] }>(`/api/tasks${query.toString() ? `?${query.toString()}` : ""}`);
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    try {
      const data = await apiFetch<{ projects: ProjectSummary[] }>("/api/projects");
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load task filters.");
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async (projectId: string) => {
    if (!projectId || user?.role !== "ADMIN") {
      setProjectMembers([]);
      return;
    }

    try {
      const data = await apiFetch<{ members: ProjectMember[] }>(`/api/projects/${projectId}/members`);
      setProjectMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load project members.");
    }
  }, [user?.role]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (modalMode && form.projectId) {
      void loadMembers(form.projectId);
    }
  }, [form.projectId, modalMode, loadMembers]);

  function openCreate() {
    const initialProjectId = filters.projectId || projects[0]?.id || "";
    setSelectedTask(null);
    setForm(blankForm(initialProjectId));
    setProjectMembers([]);
    setModalMode("create");
  }

  function openEdit(task: Task) {
    setSelectedTask(task);
    setForm(taskToForm(task));
    setProjectMembers([]);
    setModalMode("edit");
  }

  async function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      assignedToId: form.assignedToId || null
    };

    try {
      if (modalMode === "edit" && selectedTask) {
        const data = await apiFetch<{ task: Task }>(`/api/tasks/${selectedTask.id}`, {
          method: "PATCH",
          json: payload
        });
        setTasks((current) => current.map((task) => (task.id === data.task.id ? data.task : task)));
        setNotice("Task updated.");
      } else {
        const data = await apiFetch<{ task: Task }>("/api/tasks", {
          method: "POST",
          json: payload
        });
        setTasks((current) => [data.task, ...current]);
        setNotice("Task created.");
      }

      setModalMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setNotice("Task deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete task.");
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
      setTasks((current) => current.map((item) => (item.id === task.id ? data.task : item)));
      setNotice("Task status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="relative overflow-hidden rounded-lg border border-white/70 bg-white/90 p-6 shadow-card backdrop-blur sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0891b2,#2563eb,#059669)]" />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-700">
              Task operations
            </div>
            <h1 className="text-3xl font-black tracking-tight text-ink">Tasks</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {user?.role === "ADMIN" ? "Create, assign, update, and remove tasks." : "Your assigned tasks across active projects."}
            </p>
          </div>
          {user?.role === "ADMIN" ? (
            <Button type="button" onClick={openCreate} disabled={projects.length === 0}>
              <Plus className="h-4 w-4" />
              New task
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <Alert message={error} /> : null}
      {notice ? <Alert message={notice} tone="success" /> : null}

      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-ink">Filters</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Narrow tasks by status, project, or overdue work.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <Field label="Status">
            <Select value={filters.status} onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))}>
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project">
            <Select value={filters.projectId} onChange={(event) => setFilters((value) => ({ ...value, projectId: event.target.value }))}>
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={(event) => setFilters((value) => ({ ...value, overdue: event.target.checked }))}
              className="h-4 w-4 rounded border-line accent-brand-600"
            />
            Overdue
          </label>
          <Button type="button" variant="secondary" onClick={() => setFilters({ status: "", projectId: "", overdue: false })}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </Card>

      {loading || metaLoading ? (
        <LoadingBlock label="Loading tasks" />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={
            user?.role === "ADMIN"
              ? "Create a task or adjust filters to find existing work."
              : "Assigned tasks will appear here when an admin assigns them to you."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Task</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Assign to</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {tasks.map((task) => (
                  <tr key={task.id} className="transition hover:bg-slate-50/70">
                    <td className="max-w-sm px-5 py-4">
                      <div className="font-semibold text-ink">{task.title}</div>
                      {task.description ? <div className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</div> : null}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {task.project ? (
                        <Link
                          href={`/projects/${task.project.id}`}
                          className="font-bold text-brand-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                        >
                          {task.project.name}
                        </Link>
                      ) : (
                        "No project"
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{task.assignedTo?.name ?? "Unassigned"}</td>
                    <td className="px-5 py-4">
                      {user?.role === "MEMBER" && task.assignedToId === user.id ? (
                        <Select value={task.status} onChange={(event) => void updateTaskStatus(task, event.target.value as TaskStatus)} className="min-w-36">
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
                    <td className="px-5 py-4">
                      {user?.role === "ADMIN" ? (
                        <div className="flex gap-2">
                          <Button type="button" variant="secondary" className="min-h-9 px-3" onClick={() => openEdit(task)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="danger" className="min-h-9 px-3" onClick={() => void deleteTask(task)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Status only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {modalMode ? (
        <Modal title={modalMode === "create" ? "Create task" : "Edit task"} onClose={() => setModalMode(null)}>
          <form className="grid gap-4" onSubmit={(event) => void saveTask(event)}>
            <Field label="Task title">
              <Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} required />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Project">
                <Select
                  value={form.projectId}
                  onChange={(event) => setForm((value) => ({ ...value, projectId: event.target.value, assignedToId: "" }))}
                  required
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Assign to">
                <Select
                  value={form.assignedToId}
                  onChange={(event) => setForm((value) => ({ ...value, assignedToId: event.target.value }))}
                  disabled={!form.projectId}
                >
                  <option value="">Unassigned</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Due date">
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((value) => ({ ...value, dueDate: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as TaskStatus }))}>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(event) => setForm((value) => ({ ...value, priority: event.target.value as TaskPriority }))}>
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalMode(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !form.projectId}>
                {saving ? "Saving" : "Save task"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
