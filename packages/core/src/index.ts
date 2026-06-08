export type EmotionModeId = "happy" | "angry" | "sad" | "messy";

export type DiaryStatus = "已整理" | "草稿";

export type SafetyFlag =
  | "none"
  | "self_harm"
  | "harm_others"
  | "medical_advice"
  | "diagnosis_request"
  | "violent_retaliation"
  | "privacy_sensitive";

export interface DiaryStructuredData {
  scenes: string[];
  events: string[];
  people: string[];
  emotions: string[];
  bodyState: string[];
  trigger: string[];
  automaticThoughts: string[];
  coreFeeling: string;
  needs: string[];
  actions: string[];
  tags: string[];
  safetyFlag: SafetyFlag;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "system" | "user";
  content: string;
  source?: "ai" | "fallback";
  sourceNote?: string;
}

export type ChatSessionStatus = "active" | "ready_to_summarize" | "summarized" | "saved";

export interface ChatSessionDetail {
  id: string;
  mode: EmotionModeId;
  status: ChatSessionStatus;
  messages: ChatMessage[];
  draft: DraftDiary | null;
  createdAt: string;
  updatedAt: string;
}

export interface DraftDiary {
  diaryText: string;
  summary: string;
  tags: string[];
  title: string;
}

export interface DiaryEntry {
  id: string;
  mode: EmotionModeId;
  modeLabel: string;
  status: DiaryStatus;
  summary: string;
  tags: string[];
  time: string;
  title: string;
  diaryText: string;
}

export interface EntryListItem {
  id: string;
  date: string;
  mode: EmotionModeId;
  modeLabel: string;
  title: string;
  summary: string;
  tags: string[];
  privacyLevel: "normal" | "locked";
  createdAt: string;
  updatedAt: string;
}

export interface EntryDetail extends EntryListItem {
  diaryText: string;
  structured: DiaryStructuredData;
  rawConversation: ChatMessage[];
  userEdited: boolean;
  privacyLevel: "normal" | "locked";
}

export interface EntryWriteInput {
  date?: string;
  mode: EmotionModeId;
  title?: string;
  diaryText: string;
  summary: string;
  tags?: string[];
  privacyLevel?: "normal" | "locked";
  structured?: Partial<DiaryStructuredData>;
  rawConversation?: ChatMessage[];
}

export interface EmotionModeDefinition {
  id: EmotionModeId;
  label: string;
  symbol: string;
  description: string;
}

export const emotionModes: EmotionModeDefinition[] = [
  {
    id: "happy",
    label: "记点开心的",
    symbol: "晴",
    description: "保存开心、温暖、轻松、可爱的小事，不急着分析。"
  },
  {
    id: "angry",
    label: "想骂两句",
    symbol: "火",
    description: "允许先发泄，再整理愤怒背后的边界和需求。"
  },
  {
    id: "sad",
    label: "有点难过",
    symbol: "雨",
    description: "轻轻接住委屈、失落、舍不得，不催你积极。"
  },
  {
    id: "messy",
    label: "脑子很乱",
    symbol: "雾",
    description: "把事实、担心和当下能做的一小步慢慢拆开。"
  }
];
