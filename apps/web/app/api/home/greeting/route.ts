import { NextResponse } from "next/server";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { buildHomeGreeting } from "@/lib/server/home-greeting";
import { getUserPreferences } from "@/lib/server/user-preferences";

export async function GET() {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const preferences = await getUserPreferences(account.id);
  const greeting = await buildHomeGreeting({
    preferences,
    userId: account.id
  });

  return NextResponse.json(greeting);
}
