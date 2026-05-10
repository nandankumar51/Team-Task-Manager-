"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { AuthRoleSelector } from "@/components/AuthRoleSelector";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/client-api";
import type { Role } from "@/types";

const demoUsers = [
  { label: "Admin demo", email: "admin@example.com", password: "Admin123!", role: "ADMIN" as const },
  { label: "Member demo", email: "member@example.com", password: "Member123!", role: "MEMBER" as const }
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        json: { email, password, role }
      });
      await refreshUser();
      router.push(searchParams.get("next") || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to manage project work, team membership, and delivery status."
      switchLabel="New to the workspace?"
      switchHref="/signup"
      switchText="Create an account"
    >
      <div className="mb-4 rounded-lg border border-line bg-slate-50/80 p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Demo accounts</p>
        <div className="grid grid-cols-2 gap-2">
          {demoUsers.map((demo) => (
            <button
              key={demo.email}
              type="button"
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
              onClick={() => {
                setEmail(demo.email);
                setPassword(demo.password);
                setRole(demo.role);
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>

      <form className="grid gap-4" onSubmit={submit}>
        {error ? <Alert message={error} /> : null}
        <AuthRoleSelector value={role} onChange={setRole} label="Log in as" />
        <Field label="Email">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </Field>
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          <LogIn className="h-4 w-4" />
          {loading ? "Signing in" : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
