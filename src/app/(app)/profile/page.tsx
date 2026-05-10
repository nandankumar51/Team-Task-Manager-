"use client";

import { useEffect, useState } from "react";
import { Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Alert, Badge, Card, LoadingBlock } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/client-api";
import type { User } from "@/types";

type UsersResponse = {
  users: User[];
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    let active = true;

    if (user?.role !== "ADMIN") {
      setWorkspaceUsers([]);
      setUsersError("");
      return;
    }

    setUsersLoading(true);
    setUsersError("");

    apiFetch<UsersResponse>("/api/users")
      .then((data) => {
        if (active) {
          setWorkspaceUsers(data.users);
        }
      })
      .catch((error) => {
        if (active) {
          setUsersError(error instanceof Error ? error.message : "Unable to load workspace members.");
        }
      })
      .finally(() => {
        if (active) {
          setUsersLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user?.role]);

  return (
    <div className="grid gap-6">
      <div className="relative overflow-hidden rounded-lg border border-white/70 bg-white/90 p-6 shadow-card backdrop-blur sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb,#059669)]" />
        <div className="mb-3 inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
          Account
        </div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Profile</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your current account and access level.</p>
      </div>

      <Card className="max-w-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-brand-50 p-3 text-brand-700 ring-1 ring-brand-100">
            <UserRound className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-ink">{user?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{user?.workspace?.name}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Badge tone={user?.role === "ADMIN" ? "blue" : "slate"}>{user?.role}</Badge>
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <ShieldCheck className="h-4 w-4 text-success-700" />
                Session active
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="max-w-2xl p-6">
        <h2 className="font-bold text-ink">Access summary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {user?.role === "ADMIN"
            ? "Admins can manage projects, teams, tasks, assignments, and dashboard analytics across the workspace."
          : "Members can view joined projects, see assigned tasks, and update the status of their own tasks."}
        </p>
      </Card>

      {user?.role === "ADMIN" ? (
        <Card className="max-w-4xl overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-brand-700" />
                <h2 className="font-bold text-ink">Workspace members</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Members who sign up with your admin email or accept project invitations appear here.
              </p>
            </div>
            <Badge tone="blue">{workspaceUsers.length} users</Badge>
          </div>

          <div className="p-5">
            {usersLoading ? <LoadingBlock label="Loading members" /> : null}
            {!usersLoading && usersError ? <Alert message={usersError} /> : null}
            {!usersLoading && !usersError ? (
              <div className="overflow-hidden rounded-lg border border-line">
                <div className="grid grid-cols-[1fr_auto] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid-cols-[1.4fr_0.8fr_auto]">
                  <span>User</span>
                  <span className="hidden sm:block">Email</span>
                  <span>Role</span>
                </div>
                <div className="divide-y divide-line bg-white">
                  {workspaceUsers.map((workspaceUser) => (
                    <div
                      key={workspaceUser.id}
                      className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-sm transition hover:bg-slate-50 sm:grid-cols-[1.4fr_0.8fr_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{workspaceUser.name}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 sm:hidden">
                          <Mail className="h-3.5 w-3.5" />
                          {workspaceUser.email}
                        </p>
                      </div>
                      <p className="hidden min-w-0 truncate text-slate-600 sm:block">{workspaceUser.email}</p>
                      <Badge tone={workspaceUser.role === "ADMIN" ? "blue" : "slate"}>{workspaceUser.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
