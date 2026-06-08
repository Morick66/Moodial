import { AnalysisWorkspace } from "@/components/pages/AnalysisWorkspace";
import { requireAppAccess } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  await requireAppAccess();
  return <AnalysisWorkspace />;
}
