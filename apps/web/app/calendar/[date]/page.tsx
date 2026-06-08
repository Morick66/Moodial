import { DayWorkspace } from "@/components/pages/DayWorkspace";
import { requireAppAccess } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

type CalendarDayPageProps = {
  params: Promise<{ date: string }>;
};

export default async function CalendarDayPage({ params }: CalendarDayPageProps) {
  await requireAppAccess();
  const { date } = await params;

  return <DayWorkspace date={decodeURIComponent(date)} />;
}
