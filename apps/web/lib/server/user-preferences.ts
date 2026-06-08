import { prisma } from "@jzmle/db";

const USER_PREFERENCES_PREFIX = "user.preferences.";

export type UserPreferences = {
  aiDisplayName: string;
  avatar: UserAvatarPreference;
};

export type UserAvatarPreference =
  | {
      color: string;
      icon: string;
      initial: string;
      type: "style";
    }
  | {
      type: "url";
      url: string;
    }
  | {
      contentType: string;
      file: string;
      type: "upload";
      url: string;
    };

export function userPreferencesKey(userId: string) {
  return `${USER_PREFERENCES_PREFIX}${userId}`;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: userPreferencesKey(userId) }
  });

  return readUserPreferences(setting?.valueJson);
}

export async function saveUserPreferences(userId: string, input: { aiDisplayName?: string; avatar?: unknown }) {
  const current = await getUserPreferences(userId);
  const next: UserPreferences = {
    aiDisplayName: normalizeDisplayName(input.aiDisplayName ?? current.aiDisplayName),
    avatar: normalizeAvatar(input.avatar ?? current.avatar)
  };

  await prisma.appSetting.upsert({
    where: { key: userPreferencesKey(userId) },
    update: { valueJson: next },
    create: {
      key: userPreferencesKey(userId),
      valueJson: next
    }
  });

  return next;
}

function readUserPreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object") {
    return { aiDisplayName: "", avatar: defaultAvatarPreference };
  }

  const aiDisplayName = (value as { aiDisplayName?: unknown }).aiDisplayName;
  const avatar = (value as { avatar?: unknown }).avatar;
  return {
    aiDisplayName: normalizeDisplayName(typeof aiDisplayName === "string" ? aiDisplayName : ""),
    avatar: normalizeAvatar(avatar)
  };
}

export function normalizeDisplayName(value: string) {
  return value.trim().slice(0, 40);
}

export const avatarColors = ["rosewood", "moss", "clay", "dusk"] as const;
export const avatarIcons = ["spark", "moon", "leaf", "wave"] as const;

const defaultAvatarPreference: UserAvatarPreference = {
  color: "rosewood",
  icon: "spark",
  initial: "",
  type: "style"
};

function normalizeAvatar(value: unknown): UserAvatarPreference {
  if (!value || typeof value !== "object") return defaultAvatarPreference;
  const avatar = value as Record<string, unknown>;

  if (avatar.type === "url") {
    const url = typeof avatar.url === "string" ? avatar.url.trim().slice(0, 500) : "";
    if (isSafeImageUrl(url)) return { type: "url", url };
  }

  if (avatar.type === "upload") {
    const file = typeof avatar.file === "string" ? avatar.file : "";
    const url = typeof avatar.url === "string" ? avatar.url : "";
    const contentType = typeof avatar.contentType === "string" ? avatar.contentType : "image/jpeg";
    if (/^[a-zA-Z0-9_.-]+$/.test(file) && url.startsWith("/api/me/avatar/")) {
      return { contentType, file, type: "upload", url };
    }
  }

  const color = typeof avatar.color === "string" && avatarColors.includes(avatar.color as (typeof avatarColors)[number]) ? avatar.color : "rosewood";
  const icon = typeof avatar.icon === "string" && avatarIcons.includes(avatar.icon as (typeof avatarIcons)[number]) ? avatar.icon : "spark";
  const initial = typeof avatar.initial === "string" ? normalizeDisplayName(avatar.initial).slice(0, 2) : "";

  return {
    color,
    icon,
    initial,
    type: "style"
  };
}

function isSafeImageUrl(value: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
