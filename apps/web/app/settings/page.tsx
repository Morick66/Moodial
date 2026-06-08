import { SettingsWorkspace } from "@/components/pages/SettingsWorkspace";
import { requireAppAccess } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAppAccess();
  return <SettingsWorkspace />;
}
