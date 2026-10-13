import { NextResponse } from "next/server";
import {
  authenticated,
  failure,
  field,
  HubError,
  limited,
  readJson,
} from "@/lib/hub/server";
import { captureJob } from "@/lib/hub/job-capture";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { db } = await authenticated(request);
    const body = await readJson(request, 4096);
    await limited(db, "capture");
    const url = field(body.url, "Job URL", 2048, true);
    try {
      new URL(url);
    } catch {
      throw new HubError("Enter a valid job URL.");
    }
    return NextResponse.json(await captureJob(url), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
