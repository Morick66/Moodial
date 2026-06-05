import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const algorithm = "aes-256-gcm";

export function encryptSetting(value: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSetting(value: string) {
  if (!value.startsWith("v1:")) return "";
  const [, ivText, tagText, encryptedText] = value.split(":");
  if (!ivText || !tagText || !encryptedText) return "";

  const key = getEncryptionKey();
  const decipher = createDecipheriv(algorithm, key, Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64")), decipher.final()]);

  return decrypted.toString("utf8");
}

export function assertEncryptionReady() {
  getEncryptionSecret();
}

function getEncryptionKey() {
  return createHash("sha256").update(getEncryptionSecret()).digest();
}

function getEncryptionSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret === "dev-secret-change-me-before-production-32" || secret === "replace-with-a-long-random-secret") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("生产环境需要先配置 BETTER_AUTH_SECRET");
    }
  }

  return secret ?? "dev-secret-change-me-before-production-32";
}
