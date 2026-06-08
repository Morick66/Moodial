import { EntryDetailWorkspace } from "@/components/pages/EntryDetailWorkspace";
import { requireAppAccess } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAppAccess();
  const { id } = await params;
  return <EntryDetailWorkspace id={id} />;
}
