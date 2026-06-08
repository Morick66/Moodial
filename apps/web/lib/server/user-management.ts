import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@jzmle/db";
import type { Prisma } from "@prisma/client";

export const LOCAL_OWNER_ID = "local-owner";

export type CreateAuthBackedUserInput = {
  displayName?: string;
  password: string;
  role?: "ADMIN" | "USER";
  username: string;
};

export async function createAuthBackedUser(input: CreateAuthBackedUserInput) {
  const username = normalizeUsername(input.username);
  if (!username) throw new Error("请填写用户名");
  if (!isValidUsername(username)) throw new Error("用户名只能包含字母、数字、点、下划线和连字符");
  if (input.password.length < 8) throw new Error("密码至少 8 位");

  const now = new Date();
  const id = randomUUID();
  const email = `${username}@local.invalid`;
  const displayName = input.displayName?.trim() || username;
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });
    const existingProfile = await tx.userAccount.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existingUser || existingProfile) {
      throw new Error("用户名已经存在");
    }

    const authUser = await tx.user.create({
      data: {
        id,
        name: displayName,
        email,
        emailVerified: true,
        username,
        displayUsername: input.username.trim(),
        createdAt: now,
        updatedAt: now
      }
    });

    await tx.account.create({
      data: {
        id: randomUUID(),
        accountId: authUser.id,
        providerId: "credential",
        userId: authUser.id,
        password: passwordHash,
        createdAt: now,
        updatedAt: now
      }
    });

    const profile = await tx.userAccount.create({
      data: {
        id: authUser.id,
        authUserId: authUser.id,
        username,
        email,
        displayName,
        passwordHash: "managed-by-better-auth",
        role: input.role ?? "USER",
        status: "ACTIVE"
      }
    });

    return { authUser, profile };
  });
}

export async function migrateLocalOwnerDataToUser(userId: string) {
  if (userId === LOCAL_OWNER_ID) return;

  const localOwner = await prisma.userAccount.findUnique({
    where: { id: LOCAL_OWNER_ID }
  });
  if (!localOwner) return;

  await prisma.$transaction([
    prisma.diaryEntry.updateMany({
      where: { userId: LOCAL_OWNER_ID },
      data: { userId }
    }),
    prisma.chatSession.updateMany({
      where: { userId: LOCAL_OWNER_ID },
      data: { userId }
    }),
    prisma.subscription.updateMany({
      where: { userId: LOCAL_OWNER_ID },
      data: { userId }
    }),
    prisma.usageRecord.updateMany({
      where: { userId: LOCAL_OWNER_ID },
      data: { userId }
    }),
    prisma.userAccount.update({
      where: { id: LOCAL_OWNER_ID },
      data: {
        deletedAt: new Date(),
        status: "DELETED",
        username: `${LOCAL_OWNER_ID}-migrated-${Date.now()}`
      }
    })
  ]);
}

export async function softDeleteUserData(userId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const deletedAt = new Date();

  await tx.diaryEntry.updateMany({
    where: { userId, deletedAt: null },
    data: { deletedAt }
  });
  await tx.chatSession.updateMany({
    where: { userId },
    data: { status: "deleted" }
  });
  await tx.subscription.updateMany({
    where: { userId },
    data: { status: "deleted" }
  });
  await tx.userAccount.update({
    where: { id: userId },
    data: {
      deletedAt,
      status: "DELETED"
    }
  });
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function isValidUsername(value: string) {
  return /^[a-zA-Z0-9_.-]{3,}$/.test(value);
}
