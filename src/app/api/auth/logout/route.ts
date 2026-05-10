import { clearSessionCookie } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

export async function POST() {
  try {
    await clearSessionCookie();
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
