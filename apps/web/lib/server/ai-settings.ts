import { prisma } from "@jzmle/db";
import { assertEncryptionReady, decryptSetting, encryptSetting } from "@/lib/server/crypto-settings";

export const AI_SETTINGS_KEY = "ai.openai_compatible";

export type AiSettingsInput = {
  apiKey?: string;
  baseUrl: string;
  model: string;
  provider: "openai_compatible";
};

export type AiSettingsPublic = {
  baseUrl: string;
  configured: boolean;
  hasApiKey: boolean;
  model: string;
  provider: "openai_compatible";
};

export type AiSettingsPrivate = AiSettingsPublic & {
  apiKey: string;
};

const defaultSettings: AiSettingsPublic = {
  baseUrl: "",
  configured: false,
  hasApiKey: false,
  model: "",
  provider: "openai_compatible"
};

export async function getAiSettingsPublic(): Promise<AiSettingsPublic> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: AI_SETTINGS_KEY }
  });

  return toPublicSettings(setting?.valueJson);
}

export async function getAiSettingsPrivate(): Promise<AiSettingsPrivate | null> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: AI_SETTINGS_KEY }
  });
  const record = normalizeSettingsRecord(setting?.valueJson);
  if (!record?.encryptedApiKey || !record.baseUrl || !record.model) return null;

  const apiKey = decryptSetting(record.encryptedApiKey);
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: record.baseUrl,
    configured: true,
    hasApiKey: true,
    model: record.model,
    provider: "openai_compatible"
  };
}

export async function saveAiSettings(input: AiSettingsInput) {
  assertEncryptionReady();

  const existing = await prisma.appSetting.findUnique({
    where: { key: AI_SETTINGS_KEY }
  });
  const existingRecord = normalizeSettingsRecord(existing?.valueJson);
  const encryptedApiKey = input.apiKey?.trim() ? encryptSetting(input.apiKey.trim()) : existingRecord?.encryptedApiKey ?? "";

  if (!input.baseUrl.trim()) throw new Error("请填写 Base URL");
  if (!input.model.trim()) throw new Error("请填写模型名称");
  if (!encryptedApiKey) throw new Error("请填写 API Key");

  await prisma.appSetting.upsert({
    where: { key: AI_SETTINGS_KEY },
    update: {
      encrypted: true,
      valueJson: {
        baseUrl: input.baseUrl.trim(),
        encryptedApiKey,
        model: input.model.trim(),
        provider: "openai_compatible"
      }
    },
    create: {
      encrypted: true,
      key: AI_SETTINGS_KEY,
      valueJson: {
        baseUrl: input.baseUrl.trim(),
        encryptedApiKey,
        model: input.model.trim(),
        provider: "openai_compatible"
      }
    }
  });

  return getAiSettingsPublic();
}

function toPublicSettings(value: unknown): AiSettingsPublic {
  const record = normalizeSettingsRecord(value);
  if (!record) return defaultSettings;

  return {
    baseUrl: record.baseUrl,
    configured: Boolean(record.baseUrl && record.model && record.encryptedApiKey),
    hasApiKey: Boolean(record.encryptedApiKey),
    model: record.model,
    provider: "openai_compatible"
  };
}

function normalizeSettingsRecord(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const provider = record.provider === "openai_compatible" ? "openai_compatible" : null;
  const baseUrl = typeof record.baseUrl === "string" ? record.baseUrl : "";
  const model = typeof record.model === "string" ? record.model : "";
  const encryptedApiKey = typeof record.encryptedApiKey === "string" ? record.encryptedApiKey : "";

  if (!provider) return null;
  return { baseUrl, encryptedApiKey, model, provider };
}
