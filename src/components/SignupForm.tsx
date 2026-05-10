"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { AuthRoleSelector } from "@/components/AuthRoleSelector";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/client-api";
import type { Role } from "@/types";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const invitedEmail = searchParams.get("email") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(invitedEmail ? "MEMBER" : "ADMIN");
  const [adminEmail, setAdminEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        json: {
          name,
          email,
          password,
          role,
          adminEmail: role === "MEMBER" ? adminEmail : undefined
        }
      });
      await refreshUser();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Choose admin to start a workspace, or member to join an existing admin workspace."
      switchLabel="Already have an account?"
      switchHref="/login"
      switchText="Log in"
    >
      <form className="grid gap-4" onSubmit={submit}>
        {error ? <Alert message={error} /> : null}
        <AuthRoleSelector value={role} onChange={setRole} />
        <Field label="Name">
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        {role === "MEMBER" ? (
          <div className="grid gap-2">
            <Field label="Admin email">
              <Input
                type="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="admin@example.com"
              />
            </Field>
            <p className="text-xs leading-5 text-slate-500">
              If an admin already invited your email, you can leave this blank. Otherwise enter the admin email to join their workspace.
            </p>
          </div>
        ) : null}
        <Field label="Password">
          <Input
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          <UserPlus className="h-4 w-4" />
          {loading ? "Creating account" : "Sign up"}
        </Button>
      </form>
      <p className="mt-4 rounded-md border border-line bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
        Admin accounts create a new workspace. Member accounts join by invite or by matching the admin email you enter here.
      </p>
    </AuthCard>
  );
}
