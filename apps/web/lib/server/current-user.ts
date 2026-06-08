import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@jzmle/db";
import { auth } from "@/lib/server/auth";
import { getSetupStatus } from "@/lib/server/setup";

export async function getCurrentAuthSession() {
  return auth.api.getSession({
    headers: await headers()
  });
}

export async function getCurrentUserAccount() {
  const session = await getCurrentAuthSession();
  if (!session?.user?.id) return null;

  return prisma.userAccount.findUnique({
    where: { authUserId: session.user.id }
  });
}

export async function requireCurrentUserAccount() {
  const account = await getCurrentUserAccount();
  if (!account || account.status !== "ACTIVE") {
    return null;
  }

  return account;
}

export async function requireAppAccess() {
  const setupStatus = await getSetupStatus().catch(() => null);
  if (!setupStatus?.initialized) redirect("/setup");

  const account = await requireCurrentUserAccount();
  if (!account) redirect("/login");

  return account;
}
