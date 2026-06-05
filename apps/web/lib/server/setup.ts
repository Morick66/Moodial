import { prisma } from "@jzmle/db";
import { createAuthBackedUser, migrateLocalOwnerDataToUser } from "@/lib/server/user-management";

export const INSTANCE_NAME_SETTING_KEY = "instance.name";

export async function getSetupStatus() {
  const [adminCount, instanceNameSetting] = await Promise.all([
    prisma.userAccount.count({
      where: { role: "ADMIN", deletedAt: null }
    }),
    prisma.appSetting.findUnique({
      where: { key: INSTANCE_NAME_SETTING_KEY }
    })
  ]);
  const instanceName = readInstanceName(instanceNameSetting?.valueJson);

  return {
    database: "connected" as const,
    initialized: adminCount > 0 && Boolean(instanceName),
    hasAdmin: adminCount > 0,
    instanceName
  };
}

export async function createInitialSetup(input: {
  displayName: string;
  instanceName: string;
  password: string;
  username: string;
}) {
  const status = await getSetupStatus();
  if (status.initialized) {
    throw new Error("实例已经初始化");
  }

  const { profile } = await createAuthBackedUser({
    displayName: input.displayName,
    password: input.password,
    role: "ADMIN",
    username: input.username
  });

  await prisma.appSetting.upsert({
    where: { key: INSTANCE_NAME_SETTING_KEY },
    update: {
      valueJson: { name: input.instanceName }
    },
    create: {
      key: INSTANCE_NAME_SETTING_KEY,
      valueJson: { name: input.instanceName }
    }
  });

  await migrateLocalOwnerDataToUser(profile.id);

  return getSetupStatus();
}

function readInstanceName(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const name = (value as { name?: unknown }).name;
  return typeof name === "string" ? name : "";
}
