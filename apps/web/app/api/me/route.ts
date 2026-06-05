import { NextResponse } from "next/server";
import { getCurrentAuthSession, getCurrentUserAccount } from "@/lib/server/current-user";

export async function GET() {
  const [session, account] = await Promise.all([getCurrentAuthSession(), getCurrentUserAccount()]);

  return NextResponse.json({
    authenticated: Boolean(session?.user?.id && account),
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        }
      : null,
    account: account
      ? {
          id: account.id,
          username: account.username,
          displayName: account.displayName,
          role: account.role,
          status: account.status
        }
      : null
  });
}
