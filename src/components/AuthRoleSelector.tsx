"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const roleOptions = [
  {
    value: "ADMIN" as const,
    label: "Admin",
    description: "Create a workspace and manage people, projects, and tasks.",
    icon: ShieldCheck
  },
  {
    value: "MEMBER" as const,
    label: "Member",
    description: "Join an admin workspace and work on assigned tasks.",
    icon: UserRound
  }
];

export function AuthRoleSelector({
  value,
  onChange,
  label = "Choose account type"
}: {
  value: Role;
  onChange: (role: Role) => void;
  label?: string;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-slate-700">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "group relative cursor-pointer rounded-lg border bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md",
                "focus-within:outline-none focus-within:ring-4 focus-within:ring-brand-100",
                selected ? "border-brand-500 bg-brand-50/70 shadow-brand-600/10" : "border-line"
              )}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="flex items-start gap-3">
                <span
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition",
                    selected ? "border-brand-200 bg-white text-brand-700" : "border-line bg-slate-50 text-slate-500"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
