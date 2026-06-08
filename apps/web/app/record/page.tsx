import { RecordWorkspace } from "@/components/pages/RecordWorkspace";
import { requireAppAccess } from "@/lib/server/current-user";
import { normalizeCompanionMode } from "@/lib/record-prefill";
import { parseEmotionMode } from "@/lib/server/entry-mapper";

export const dynamic = "force-dynamic";

export default async function RecordPage({ searchParams }: { searchParams: Promise<{ companion?: string; mode?: string; session?: string }> }) {
  await requireAppAccess();
  const { companion, mode, session } = await searchParams;
  return <RecordWorkspace initialCompanionMode={normalizeCompanionMode(companion)} initialMode={parseEmotionMode(mode) ?? undefined} initialSessionId={session} />;
}
