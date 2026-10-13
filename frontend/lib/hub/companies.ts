import records from "@/data/companies.json";
export interface Company {
  id: string;
  name: string;
  category: string;
  sector: string;
  careers_url: string;
  source_url: string;
  checked_at: string;
  verification: string;
  hiring_note: string;
  yc_batch?: string | null;
  funding_date?: string | null;
  funding_source?: string | null;
  location?: string;
  website?: string;
  company_status?: string;
}
export const companies: Company[] = records;
