import { InsightsWorkspace } from "@/components/pages/InsightsWorkspace";
import { requireAppAccess } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  await requireAppAccess();
  return <InsightsWorkspace />;
}
