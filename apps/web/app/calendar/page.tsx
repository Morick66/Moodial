import { CalendarWorkspace } from "@/components/pages/CalendarWorkspace";
import { requireAppAccess } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requireAppAccess();
  return <CalendarWorkspace />;
}
