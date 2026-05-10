"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FolderKanban, ListTodo, Plus, TimerReset } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadges";
import { Alert, Card, EmptyState, LinkButton, LoadingBlock } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { DashboardData } from "@/types";

const metricConfig = [
  { key: "totalProjects", label: "Projects", icon: FolderKanban, tone: "text-brand-600", surface: "bg-brand-50" },
  { key: "totalTasks", label: "Total tasks", icon: ListTodo, tone: "text-slate-700", surface: "bg-slate-100" },
  { key: "todoTasks", label: "To do", icon: Clock3, tone: "text-slate-600", surface: "bg-slate-100" },
  { key: "inProgressTasks", label: "In progress", icon: TimerReset, tone: "text-cyan-700", surface: "bg-cyan-50" },
  { key: "doneTasks", label: "Done", icon: CheckCircle2, tone: "text-success-700", surface: "bg-success-50" },
  { key: "overdueTasks", label: "Overdue", icon: AlertTriangle, tone: "text-danger-700", surface: "bg-danger-50" }
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await apiFetch<DashboardData>("/api/dashboard");
        if (active) {
          setData(response);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard.");
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <div className="relative overflow-hidden rounded-lg border border-white/70 bg-white/90 p-6 shadow-card backdrop-blur sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb,#0891b2,#059669)]" />
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
              Workspace overview
            </div>
            <h1 className="text-3xl font-black tracking-tight text-ink">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {user?.role === "ADMIN"
                ? "Monitor projects, assignments, overdue work, and recent task activity across the workspace."
                : "Track your assigned work, current status, and upcoming project responsibilities."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/projects">View projects</LinkButton>
            <LinkButton href="/tasks" variant="primary">
              Tasks
            </LinkButton>
          </div>
        </div>
      </div>

      {error ? <Alert message={error} /> : null}

      {!data ? (
        <LoadingBlock label="Loading dashboard" />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metricConfig.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.key} className="group overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-3xl font-black tracking-tight text-ink">{data[metric.key]}</p>
                    </div>
                    <div className={`rounded-lg p-3 ring-1 ring-inset ring-white ${metric.surface}`}>
                      <Icon className={`h-6 w-6 ${metric.tone}`} />
                    </div>
                  </div>
                  <div className="mt-5 h-1 rounded-full bg-slate-100">
                    <div className="h-1 w-1/2 rounded-full bg-brand-500 transition-all duration-300 group-hover:w-3/4" />
                  </div>
                </Card>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-slate-50/70 px-5 py-4">
                <div>
                  <h2 className="font-bold text-ink">Recent tasks</h2>
                  <p className="mt-1 text-sm text-slate-500">Most recently updated work items.</p>
                </div>
                <Link
                  href="/tasks"
                  className="text-sm font-bold text-brand-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                >
                  View all
                </Link>
              </div>

              {data.recentTasks.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No tasks yet" description="Tasks will appear here after they are assigned or created." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-line text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Task</th>
                        <th className="px-5 py-3">Project</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Priority</th>
                        <th className="px-5 py-3">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white">
                      {data.recentTasks.map((task) => (
                        <tr key={task.id} className="transition hover:bg-slate-50/70">
                          <td className="max-w-xs px-5 py-4 font-semibold text-ink">{task.title}</td>
                          <td className="px-5 py-4 text-slate-600">{task.project?.name ?? "No project"}</td>
                          <td className="px-5 py-4">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-5 py-4">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          <td className="px-5 py-4 text-slate-600">{formatDate(task.dueDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="font-bold text-ink">Quick links</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Jump into the most common workspace flows.</p>
              <div className="mt-4 grid gap-3">
                <LinkButton href="/projects" className="justify-start">
                  <FolderKanban className="h-4 w-4" />
                  Project list
                </LinkButton>
                <LinkButton href="/tasks" className="justify-start">
                  <ListTodo className="h-4 w-4" />
                  Task board
                </LinkButton>
                {user?.role === "ADMIN" ? (
                  <LinkButton href="/projects" variant="primary" className="justify-start">
                    <Plus className="h-4 w-4" />
                    Create project
                  </LinkButton>
                ) : null}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
