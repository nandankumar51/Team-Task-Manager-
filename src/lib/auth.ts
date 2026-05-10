import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

export const SESSION_COOKIE = "ttm_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
  workspace: {
    id: string;
    name: string;
  };
};

type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
};

function authSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be configured.");
  }

  return new TextEncoder().encode(secret ?? "development-secret-change-me");
}

export async function signSession(user: AuthUser) {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret());

    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.workspaceId !== "string" ||
      (payload.role !== Role.ADMIN && payload.role !== Role.MEMBER)
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      workspaceId: payload.workspaceId
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: AuthUser) {
  const token = await signSession(user);
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      workspaceId: true,
      workspace: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return user;
}

export async function requireAuth() {
  const user = await getAuthUser();

  if (!user) {
    throw new ApiError(401, "Authentication required.");
  }

  return user;
}

export function requireAdmin(user: AuthUser) {
  if (user.role !== Role.ADMIN) {
    throw new ApiError(403, "Admin access required.");
  }
}

export function toSafeUser(user: AuthUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId,
    workspace: user.workspace
  };
}
