import Link from "next/link";
import { BarChart3, FolderKanban, ListChecks, ShieldCheck, UsersRound } from "lucide-react";

const featureCards = [
  {
    title: "Admin controls",
    description: "Create projects, manage teams, assign work, and track delivery health from one dashboard.",
    icon: ShieldCheck,
    accent: "bg-brand-500"
  },
  {
    title: "Member focus",
    description: "See assigned work, update progress, and stay aligned with the projects you belong to.",
    icon: UsersRound,
    accent: "bg-accent-500"
  }
];

const stats = [
  { label: "Projects", value: "Live", icon: FolderKanban },
  { label: "Tasks", value: "Tracked", icon: ListChecks },
  { label: "Status", value: "Clear", icon: BarChart3 }
];

export function AuthCard({
  title,
  subtitle,
  switchLabel,
  switchHref,
  switchText,
  children
}: {
  title: string;
  subtitle: string;
  switchLabel: string;
  switchHref: string;
  switchText: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(37,99,235,0.16),transparent_34%),linear-gradient(315deg,rgba(8,145,178,0.13),transparent_36%)]" />

      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(390px,480px)]">
        <section className="hidden min-h-[680px] flex-col justify-between rounded-lg border border-white/70 bg-white/75 p-8 shadow-lift backdrop-blur md:flex lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Role-based task operations
            </div>
            <h1 className="mt-8 max-w-2xl text-4xl font-black leading-tight text-ink lg:text-5xl">
              Team work that stays organized from plan to done.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Team Task Manager gives admins clean control over projects, members, assignments, and delivery health while
              keeping members focused on the work that belongs to them.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-line/80 bg-white/85 p-4 shadow-sm">
                    <Icon className="h-5 w-5 text-brand-600" />
                    <div className="mt-3 text-sm font-bold text-ink">{item.value}</div>
                    <div className="mt-1 text-xs font-medium text-slate-500">{item.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="relative overflow-hidden rounded-lg border border-line/80 bg-white p-5 shadow-card">
                    <div className={`absolute inset-x-0 top-0 h-1 ${feature.accent}`} />
                    <div className="flex items-start gap-4">
                      <div className="rounded-md bg-slate-50 p-2.5 text-brand-700 ring-1 ring-line">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-ink">{feature.title}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg border border-white/70 bg-white/95 p-6 shadow-lift backdrop-blur sm:p-8">
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-white shadow-sm">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-ink">Team Task Manager</div>
                <div className="text-xs font-medium text-slate-500">Project and task control</div>
              </div>
            </div>

            <div>
              <div className="mb-3 inline-flex rounded-full border border-line bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                Secure workspace
              </div>
              <h1 className="text-2xl font-bold text-ink">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
            </div>

            <div className="mt-6">{children}</div>

            <p className="mt-6 rounded-md bg-slate-50 px-3 py-3 text-center text-sm text-slate-500">
              {switchLabel}{" "}
              <Link
                href={switchHref}
                className="font-semibold text-brand-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
              >
                {switchText}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
