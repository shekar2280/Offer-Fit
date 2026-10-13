import { NextResponse } from "next/server";
import {
  authenticated,
  failure,
  HubError,
  limited,
  readJson,
} from "@/lib/hub/server";
export const maxDuration = 60;
export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { db, user } = await authenticated(request);
    await limited(db, "ai");
    const path = (await params).path.join("/");
    if (!["ingest", "github/sync"].includes(path))
      throw new HubError("Unsupported project action.", 404);
    const body = await readJson(request, 150000);
    const {
      data: { session },
    } = await db.auth.getSession();
    if (!session) throw new HubError("Sign in again.", 401);
    const backend =
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8000" : "");
    if (!backend)
      throw new HubError("Configure the backend URL on this deployment.", 503);
    const response = await fetch(
      `${backend.replace(/\/$/, "")}/project-kb/${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          ...(process.env.BACKEND_API_KEY
            ? { "x-api-key": process.env.BACKEND_API_KEY }
            : {}),
        },
        body: JSON.stringify({ ...body, user_id: user.id }),
        signal: AbortSignal.timeout(50000),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new HubError(
        "Project sync failed. Check the repository, session, and backend configuration.",
        502,
      );
    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
