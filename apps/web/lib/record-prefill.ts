import type { EmotionModeId } from "@jzmle/core";

export type CompanionMode = "friend" | "gentle" | "rational" | "review" | "vent";

export type RecordPrefill = {
  companionMode?: CompanionMode;
  mode?: EmotionModeId;
  text?: string;
};

export const recordPrefillKey = "moodial_record_prefill";

export const companionModes: Record<CompanionMode, { body: string; promptHint: string; title: string }> = {
  gentle: {
    title: "温柔陪伴",
    body: "慢慢听你说",
    promptHint: "用更温柔、慢一点的语气回应。先接住感受，不急着分析。"
  },
  rational: {
    title: "理性分析",
    body: "帮你拆解问题",
    promptHint: "语气保持温和，但更偏梳理事实、担心、可控与不可控。"
  },
  friend: {
    title: "朋友吐槽",
    body: "轻松聊聊",
    promptHint: "像可信任的朋友一样自然承接，可以轻松一点，但不要嘲讽用户。"
  },
  vent: {
    title: "陪我发泄",
    body: "先把情绪倒出来",
    promptHint: "允许用户先发泄，先承认情绪和边界，不急着劝冷静。"
  },
  review: {
    title: "帮我复盘",
    body: "一起梳理思路",
    promptHint: "帮助用户复盘脉络，优先问关键节点、触发点和下一小步。"
  }
};

export function readRecordPrefill(): RecordPrefill | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(recordPrefillKey);
    if (!raw) return null;
    window.sessionStorage.removeItem(recordPrefillKey);
    const parsed = JSON.parse(raw) as RecordPrefill;
    return normalizeRecordPrefill(parsed);
  } catch {
    return null;
  }
}

export function writeRecordPrefill(prefill: RecordPrefill) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(recordPrefillKey, JSON.stringify(normalizeRecordPrefill(prefill)));
}

export function normalizeCompanionMode(value: unknown): CompanionMode | undefined {
  if (value === "gentle" || value === "rational" || value === "friend" || value === "vent" || value === "review") return value;
  return undefined;
}

export function normalizeRecordPrefill(value: RecordPrefill): RecordPrefill {
  return {
    companionMode: normalizeCompanionMode(value.companionMode),
    mode: normalizeEmotionMode(value.mode),
    text: typeof value.text === "string" ? value.text.trim().slice(0, 1200) : undefined
  };
}

function normalizeEmotionMode(value: unknown): EmotionModeId | undefined {
  if (value === "happy" || value === "angry" || value === "sad" || value === "messy") return value;
  return undefined;
}
