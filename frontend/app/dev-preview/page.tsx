import { notFound } from "next/navigation";
import { HubPreview } from "@/components/features/hub/hub-preview";
import { Suspense } from "react";
export default function PreviewPage() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.OFFERFIT_PREVIEW_ENABLED !== "true"
  )
    notFound();
  return (
    <Suspense fallback={<p>Loading development preview…</p>}>
      <HubPreview />
    </Suspense>
  );
}
