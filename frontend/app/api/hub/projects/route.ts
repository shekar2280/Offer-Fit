import { NextResponse } from "next/server";
import { authenticated, dbCheck, failure } from "@/lib/hub/server";
export async function GET() {
  try {
    const { db, user } = await authenticated();
    const { data, error } = await db
      .from("project_intelligence")
      .select("id,project_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    dbCheck(error);
    return NextResponse.json(
      { projects: data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
