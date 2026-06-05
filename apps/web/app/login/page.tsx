import { redirect } from "next/navigation";
import { LoginWorkspace } from "@/components/pages/LoginWorkspace";
import { getCurrentUserAccount } from "@/lib/server/current-user";
import { getSetupStatus } from "@/lib/server/setup";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const setupStatus = await getSetupStatus().catch(() => null);
  if (!setupStatus?.initialized) redirect("/setup");

  const account = await getCurrentUserAccount();
  if (account) redirect("/");

  return <LoginWorkspace />;
}
