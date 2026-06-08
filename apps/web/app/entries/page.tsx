import { EntriesWorkspace } from "@/components/pages/EntriesWorkspace";
import { requireAppAccess } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

export default async function EntriesPage() {
  await requireAppAccess();
  return <EntriesWorkspace />;
}
