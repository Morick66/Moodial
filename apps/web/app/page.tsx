import { OverviewDashboard } from "@/components/pages/OverviewDashboard";
import { requireAppAccess } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireAppAccess();
  return <OverviewDashboard />;
}
