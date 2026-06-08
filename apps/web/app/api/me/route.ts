import { NextResponse } from "next/server";
import { getCurrentAuthSession, getCurrentUserAccount } from "@/lib/server/current-user";
import { prisma } from "@jzmle/db";
import { softDeleteUserData } from "@/lib/server/user-management";
import { getUserPreferences, normalizeDisplayName, saveUserPreferences } from "@/lib/server/user-preferences";

export async function GET() {
  const [session, account] = await Promise.all([getCurrentAuthSession(), getCurrentUserAccount()]);
  const preferences = account ? await getUserPreferences(account.id) : { aiDisplayName: "" };

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
      : null,
    preferences
  });
}

export async function PATCH(request: Request) {
  const account = await getCurrentUserAccount();
  if (!account || account.status !== "ACTIVE") return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const displayName = typeof body?.displayName === "string" ? normalizeDisplayName(body.displayName) : account.displayName ?? account.username;
  const aiDisplayName = typeof body?.aiDisplayName === "string" ? body.aiDisplayName : "";
  const avatar = body?.avatar;
  if (!displayName) return NextResponse.json({ error: "显示名不能为空" }, { status: 400 });

  const updatedAccount = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const nextAccount = await tx.userAccount.update({
      where: { id: account.id },
      data: {
        displayName,
        updatedAt: now
      }
    });
    if (account.authUserId) {
      await tx.user.update({
        where: { id: account.authUserId },
        data: {
          name: displayName,
          updatedAt: now
        }
      });
    }

    return nextAccount;
  });
  const preferences = await saveUserPreferences(account.id, { aiDisplayName, avatar });

  return NextResponse.json({
    account: {
      id: updatedAccount.id,
      username: updatedAccount.username,
      displayName: updatedAccount.displayName,
      role: updatedAccount.role,
      status: updatedAccount.status
    },
    preferences
  });
}

export async function DELETE() {
  const account = await getCurrentUserAccount();
  if (!account || account.status !== "ACTIVE") return NextResponse.json({ error: "请先登录" }, { status: 401 });

  await prisma.$transaction(async (tx) => {
    await softDeleteUserData(account.id, tx);
  });

  return new Response(null, { status: 204 });
}
