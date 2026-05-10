"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Edit3, FolderKanban, ListChecks, Plus, Trash2, UsersRound } from "lucide-react";
import { Alert, Button, Card, EmptyState, Field, Input, LoadingBlock, Modal, Textarea } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { ProjectSummary } from "@/types";

type ProjectFormState = {
  name: string;
  description: string;
};

const blankForm: ProjectFormState = {
  name: "",
  description: ""
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [form, setForm] = useState<ProjectFormState>(blankForm);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ projects: ProjectSummary[] }>("/api/projects");
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  function openCreate() {
    setSelectedProject(null);
    setForm(blankForm);
    setModalMode("create");
  }

  function openEdit(project: ProjectSummary) {
    setSelectedProject(project);
    setForm({
      name: project.name,
      description: project.description ?? ""
    });
    setModalMode("edit");
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (modalMode === "edit" && selectedProject) {
        const data = await apiFetch<{ project: ProjectSummary }>(`/api/projects/${selectedProject.id}`, {
          method: "PATCH",
          json: form
        });
        setProjects((current) => current.map((project) => (project.id === data.project.id ? data.project : project)));
        setNotice("Project updated.");
      } else {
        const data = await apiFetch<{ project: ProjectSummary }>("/api/projects", {
          method: "POST",
          json: form
        });
        setProjects((current) => [data.project, ...current]);
        setNotice("Project created.");
      }

      setModalMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(project: ProjectSummary) {
    if (!window.confirm(`Delete "${project.name}" and all of its tasks?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await apiFetch(`/api/projects/${project.id}`, { method: "DELETE" });
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setNotice("Project deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete project.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="relative overflow-hidden rounded-lg border border-white/70 bg-white/90 p-6 shadow-card backdrop-blur sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb,#0891b2)]" />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Project portfolio
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink">Projects</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {user?.role === "ADMIN" ? "Create projects and manage workspaces." : "Projects where you are a team member."}
          </p>
        </div>
        {user?.role === "ADMIN" ? (
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        ) : null}
        </div>
      </div>

      {error ? <Alert message={error} /> : null}
      {notice ? <Alert message={notice} tone="success" /> : null}

      {loading ? (
        <LoadingBlock label="Loading projects" />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={
            user?.role === "ADMIN"
              ? "Create your first project to start assigning team work."
              : "An admin needs to add you to a project before it appears here."
          }
          action={
            user?.role === "ADMIN" ? (
              <Button type="button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create project
              </Button>
            ) : null
          }
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group relative flex flex-col overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
              <div className="absolute inset-x-0 top-0 h-1 bg-brand-500 opacity-80 transition group-hover:bg-accent-500" />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                      <FolderKanban className="h-5 w-5" />
                    </span>
                    <h2 className="truncate text-lg font-bold text-ink">{project.name}</h2>
                  </div>
                  <p className="mt-2 line-clamp-3 min-h-12 text-sm leading-6 text-slate-500">
                    {project.description || "No description added."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Members</div>
                  <div className="mt-1 flex items-center gap-1 font-bold text-ink">
                    <UsersRound className="h-4 w-4 text-slate-500" />
                    {project._count?.members ?? 0}
                  </div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Tasks</div>
                  <div className="mt-1 flex items-center gap-1 font-bold text-ink">
                    <ListChecks className="h-4 w-4 text-slate-500" />
                    {project._count?.tasks ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-500">Updated {formatDate(project.updatedAt)}</div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                >
                  Open
                </Link>
                {user?.role === "ADMIN" ? (
                  <>
                    <Button type="button" variant="secondary" onClick={() => openEdit(project)} className="px-3">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="danger" onClick={() => void deleteProject(project)} className="px-3">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
          ))}
        </section>
      )}

      {modalMode ? (
        <Modal title={modalMode === "create" ? "Create project" : "Edit project"} onClose={() => setModalMode(null)}>
          <form className="grid gap-4" onSubmit={(event) => void saveProject(event)}>
            <Field label="Project name">
              <Input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required />
            </Field>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalMode(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving" : "Save project"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
