"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JobHub } from "./job-hub";
export function HubPreview() {
  const [client] = useState(() => {
    const query = new QueryClient();
    const now = new Date();
    const before = new Date(now.getTime() - 15 * 86400000).toISOString();
    query.setQueryData(["job-hub"], {
      applications: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          company: "Example Labs",
          role: "Junior Full-stack Engineer",
          location: "Bengaluru",
          status: "applied",
          job_url: "https://example.com/jobs/engineer",
          normalized_url: "https://example.com/jobs/engineer",
          jd: "Build accessible interfaces and reliable Python APIs.",
          notes: "Demo application for visual testing.",
          applied_at: before,
          last_contact_at: null,
          next_action_at: null,
          resume_id: null,
          created_at: before,
          updated_at: before,
          revision: 0,
        },
      ],
      resumes: [],
      drafts: [],
      emails: [],
      checkins: [],
      events: [],
      integrations: { gemini: false, gmail: null, gmailConfigured: false },
      timezone: "Asia/Kolkata",
    });
    return query;
  });
  return (
    <QueryClientProvider client={client}>
      <div className="bg-primary text-black text-center text-xs p-2">
        Development preview · sample data · writes disabled
      </div>
      <JobHub preview />
    </QueryClientProvider>
  );
}
