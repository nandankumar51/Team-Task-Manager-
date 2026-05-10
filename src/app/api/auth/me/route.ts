import { getAuthUser, toSafeUser } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getAuthUser();
    return jsonOk({ user: user ? toSafeUser(user) : null });
  } catch (error) {
    return handleApiError(error);
  }
}
