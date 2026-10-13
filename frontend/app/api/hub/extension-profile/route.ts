import { NextResponse } from "next/server";
import { authenticated, dbCheck, failure } from "@/lib/hub/server";
export async function GET() {
  try {
    const { db, user } = await authenticated();
    const { data, error } = await db
      .from("profiles")
      .select("full_name,phone_number,linkedin,portfolio_url")
      .eq("id", user.id)
      .maybeSingle();
    dbCheck(error);
    return NextResponse.json(
      {
        profile: {
          fullName: data?.full_name || "",
          email: user.email || "",
          phone: data?.phone_number || "",
          linkedin: data?.linkedin || "",
          portfolio: data?.portfolio_url || "",
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
