import { prisma } from "@jzmle/db";

export const LOCAL_OWNER_ID = "local-owner";

export async function ensureLocalOwner() {
  return prisma.userAccount.upsert({
    where: { id: LOCAL_OWNER_ID },
    update: {},
    create: {
      id: LOCAL_OWNER_ID,
      username: LOCAL_OWNER_ID,
      displayName: "本地用户",
      passwordHash: "auth-not-enabled"
    }
  });
}
