"use client";
import { AuthGuard } from "@/components/auth-guard";
import { JobHub } from "@/components/features/hub/job-hub";
export default function HubPage() {
  return (
    <AuthGuard>
      <JobHub />
    </AuthGuard>
  );
}
