import { SupabaseClient } from "@supabase/supabase-js";
import { CompanyIntel } from "../types";

export async function getCompanyIntel(
  supabase: SupabaseClient,
  companyName: string,
): Promise<CompanyIntel | null> {
  const { data, error } = await supabase
    .from("company_intel")
    .select("*")
    .ilike("company_name", companyName)
    .single();

  if (error || !data) return null;

  const lastUpdated = new Date(data.last_updated);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (lastUpdated < thirtyDaysAgo) {
    return null;
  }

  return data as CompanyIntel;
}

export async function upsertCompanyIntel(
  supabase: SupabaseClient,
  intel: Partial<CompanyIntel> & { company_name: string },
) {
  const { data, error } = await supabase
    .from("company_intel")
    .upsert(
      {
        ...intel,
        last_updated: new Date().toISOString(),
      },
      {
        onConflict: "company_name",
      },
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting company intel:", error);
    return null;
  }

  return data as CompanyIntel;
}
