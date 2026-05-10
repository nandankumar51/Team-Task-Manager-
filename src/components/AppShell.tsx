"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FolderKanban, ListChecks, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Badge, Button, LoadingBlock } from "@/components/ui";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/profile", label: "Profile", icon: UserRound }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <main className="min-h-screen bg-canvas p-6">
        <LoadingBlock label="Preparing workspace" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-line/80 bg-white/95 backdrop-blur">
      <div className="border-b border-line/80 px-5 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-white shadow-sm shadow-brand-600/25">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-black text-ink">Team Task Manager</div>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace control</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
                active
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-ink"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-500 group-hover:text-brand-600")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line/80 p-4">
        <div className="rounded-lg border border-line bg-slate-50/80 p-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-brand-700 ring-1 ring-line">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-ink">{user.name}</div>
              <div className="mt-1 truncate text-xs text-slate-500">{user.email}</div>
              <div className="mt-1 truncate text-xs font-medium text-slate-500">{user.workspace?.name}</div>
            </div>
          </div>
          <div className="mt-3">
            <Badge tone={user.role === "ADMIN" ? "blue" : "slate"}>{user.role}</Badge>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={logout} className="mt-3 w-full justify-start">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(239,246,255,0.9),rgba(245,247,251,0.94)_35%,#f5f7fb)]" />

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">{sidebar}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-80 max-w-[85vw] shadow-lift">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-md border border-line bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label="Open navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{user.workspace?.name ?? "Workspace"}</div>
            <div className="text-base font-black text-ink">{user.name}</div>
            </div>
            <Badge tone={user.role === "ADMIN" ? "blue" : "slate"}>{user.role}</Badge>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
