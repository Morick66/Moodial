import { RecordWorkspace } from "@/components/pages/RecordWorkspace";
import { requireAppAccess } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

export default async function RecordPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  await requireAppAccess();
  const { session } = await searchParams;
  return <RecordWorkspace initialSessionId={session} />;
}
