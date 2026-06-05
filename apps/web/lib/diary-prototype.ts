import { emotionModes, type ChatMessage, type DraftDiary, type EmotionModeId } from "@jzmle/core";

export function getAssistantReply(mode: EmotionModeId, messages: ChatMessage[]) {
  const userTurns = messages.filter((message) => message.role === "user").length;
  const latest = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

  if (/不想|别问|算了|不知道|懒得|烦/.test(latest) && userTurns > 1) {
    return "嗯，不用继续回答了。我已经能帮你先整理一版。";
  }

  if (userTurns >= 3) {
    return "可以了，我们不用把今天讲得很完整。现在点「帮我整理」，我来把这些内容收成一篇日记。";
  }

  const replies: Record<EmotionModeId, string[]> = {
    happy: ["这个画面挺值得留下。是和谁在一起的时候？", "那一刻更像是轻松、开心，还是暖暖的？"],
    angry: [
      "嗯，听起来最刺的是被推责或不被尊重。最让你火大的，是哪一句话或哪一个动作？",
      "如果只记一个点，这股火最核心的是边界被碰到，还是责任被推过来？"
    ],
    sad: ["嗯，我在。现在最重的感觉，是委屈、失落，还是舍不得？", "今天有哪一小刻让这种感觉突然变明显了吗？"],
    messy: ["先不管全部，眼前最吵的那个念头是什么？", "这是已经发生的事实，还是你担心会发生的事？"]
  };

  return replies[mode][Math.min(userTurns - 1, replies[mode].length - 1)];
}

export function createDraft(mode: EmotionModeId, userText: string): DraftDiary {
  const modeDefinition = emotionModes.find((item) => item.id === mode);
  const firstSentence = userText.split(/[。！？\n]/).find(Boolean)?.trim() ?? "今天留下了一些感受";
  const tags = getTags(mode, userText);
  const title = getTitle(mode, firstSentence);
  const summary = getSummary(mode, firstSentence);

  return {
    title,
    summary,
    tags,
    diaryText: `今天用「${modeDefinition?.label ?? "情绪记录"}」记录了一段状态。\n\n${userText}\n\n现在回看，这些内容里最值得留下的不是把事情分析得多完整，而是先把当时真实出现过的感受保存下来。今天先记到这里就好。`
  };
}

export function modeBorderColor(mode: EmotionModeId) {
  const colors: Record<EmotionModeId, string> = {
    happy: "border-t-emerald-500",
    angry: "border-t-clay",
    sad: "border-t-amber-500",
    messy: "border-t-blue-500"
  };

  return colors[mode];
}

function getTitle(mode: EmotionModeId, firstSentence: string) {
  const defaults: Record<EmotionModeId, string> = {
    happy: "值得留下的一点开心",
    angry: "这股火背后的边界",
    sad: "今天有点难过",
    messy: "把脑子里这一团先放下"
  };

  return firstSentence.length > 6 ? firstSentence.slice(0, 18) : defaults[mode];
}

function getSummary(mode: EmotionModeId, firstSentence: string) {
  const suffix: Record<EmotionModeId, string> = {
    happy: "这段记录更像是想把一个轻松的小画面留住。",
    angry: "这段记录里，愤怒背后可能有边界和被尊重的需要。",
    sad: "这段记录先轻轻放下那份难过，不急着解决。",
    messy: "这段记录先把混乱拆出一点形状，不用今晚全部想完。"
  };

  return `${firstSentence}。${suffix[mode]}`;
}

function getTags(mode: EmotionModeId, text: string) {
  const base: Record<EmotionModeId, string[]> = {
    happy: ["小快乐", "轻松"],
    angry: ["边界", "愤怒"],
    sad: ["难过", "陪伴"],
    messy: ["混乱", "安定"]
  };
  const detected = [
    ["朋友", "朋友陪伴"],
    ["工作", "工作"],
    ["加班", "加班"],
    ["家", "家庭"],
    ["累", "疲惫"],
    ["担心", "担心"],
    ["委屈", "委屈"]
  ]
    .filter(([keyword]) => text.includes(keyword))
    .map(([, tag]) => tag);

  return Array.from(new Set([...base[mode], ...detected])).slice(0, 5);
}
