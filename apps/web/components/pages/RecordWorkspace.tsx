"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { emotionModes, type ChatMessage, type DraftDiary, type EmotionModeId } from "@jzmle/core";
import { ArrowLeft, Loader2, Plus, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { EmotionModeCard } from "@/components/diary/EmotionModeCard";
import { useToast } from "@/components/toast/ToastProvider";
import { appendUserChatMessage, createChatSession, fetchChatSession, saveChatSessionEntry, streamChatMessage, summarizeChatSession } from "@/lib/chat-session-api";
import { companionModes, readRecordPrefill, type CompanionMode } from "@/lib/record-prefill";

export function RecordWorkspace({
  initialCompanionMode,
  initialMode,
  initialSessionId
}: {
  initialCompanionMode?: CompanionMode;
  initialMode?: EmotionModeId;
  initialSessionId?: string;
}) {
  const router = useRouter();
  const initializedPrefillRef = useRef(false);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [activeMode, setActiveMode] = useState<EmotionModeId | null>(null);
  const [companionMode, setCompanionMode] = useState<CompanionMode>(initialCompanionMode ?? "gentle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<DraftDiary | null>(null);
  const [loading, setLoading] = useState(Boolean(initialSessionId));
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const activeModeDefinition = useMemo(() => (activeMode ? emotionModes.find((mode) => mode.id === activeMode) : null), [activeMode]);
  const companion = companionModes[companionMode];

  useEffect(() => {
    if (!initialSessionId) return;
    const restoreSessionId = initialSessionId;
    let cancelled = false;

    async function loadSession() {
      setLoading(true);

      try {
        const session = await fetchChatSession(restoreSessionId);
        if (cancelled) return;
        setSessionId(session.id);
        setActiveMode(session.mode);
        setMessages(session.messages);
        setDraft(session.draft);
      } catch (cause) {
        if (!cancelled) showToast({ message: cause instanceof Error ? cause.message : "无法恢复这次记录", type: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [initialSessionId, showToast]);

  useEffect(() => {
    if (initialSessionId || initializedPrefillRef.current) return;
    initializedPrefillRef.current = true;

    const prefill = readRecordPrefill();
    const nextMode = prefill?.mode ?? initialMode;
    const nextCompanionMode = prefill?.companionMode ?? initialCompanionMode;
    if (nextCompanionMode) queueMicrotask(() => setCompanionMode(nextCompanionMode));
    if (nextMode) {
      void startChat(nextMode, nextCompanionMode, prefill?.text);
    } else if (prefill?.text) {
      queueMicrotask(() => setInput(prefill.text ?? ""));
    }
    // startChat intentionally reads the initial prefill once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCompanionMode, initialMode, initialSessionId]);

  async function startChat(mode: EmotionModeId, nextCompanionMode = companionMode, prefillText = "") {
    setLoading(true);
    setDraft(null);
    setInput(prefillText);
    setCompanionMode(nextCompanionMode);

    try {
      const session = await createChatSession(mode, nextCompanionMode);
      setSessionId(session.id);
      setActiveMode(session.mode);
      setMessages(session.messages);
      setDraft(session.draft);
      router.replace(`/record?session=${session.id}&companion=${nextCompanionMode}`);
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "无法开始记录", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || !activeMode || !sessionId || sending) return;
    const closeAction = detectCloseAction(content);

    const optimisticMessage: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      content
    };
    const streamingAssistantMessage: ChatMessage = {
      id: `streaming-${Date.now()}`,
      role: "assistant",
      content: "",
      source: "ai"
    };

    setSending(true);
    setInput("");
    setMessages((currentMessages) => [...currentMessages, optimisticMessage, ...(closeAction ? [] : [streamingAssistantMessage])]);

    try {
      if (closeAction) {
        const result = await appendUserChatMessage(sessionId, content);
        setMessages(result.session.messages);
        await completeRecord({ autoSave: closeAction === "save" });
        return;
      }

      const result = await streamChatMessage(sessionId, content, (delta) => {
        setMessages((currentMessages) =>
          currentMessages.map((message) => (message.id === streamingAssistantMessage.id ? { ...message, content: message.content + delta } : message))
        );
      });
      setMessages(result.session.messages);
      setDraft(result.session.draft);
      if (closeAction) {
        await completeRecord({ autoSave: closeAction === "save" });
      }
    } catch (cause) {
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== optimisticMessage.id && message.id !== streamingAssistantMessage.id));
      setInput(content);
      showToast({ message: cause instanceof Error ? cause.message : "发送失败", type: "error" });
    } finally {
      setSending(false);
    }
  }

  async function completeRecord({ autoSave = false }: { autoSave?: boolean } = {}) {
    if (!sessionId || summarizing) return;

    setSummarizing(true);

    try {
      const result = await summarizeChatSession(sessionId);
      setMessages(result.session.messages);
      setDraft(result.draft);
      if (autoSave) {
        setSaving(true);
        const entry = await saveChatSessionEntry(sessionId);
        router.push(`/entries/${entry.id}`);
      }
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : autoSave ? "整理保存失败" : "整理失败", type: "error" });
    } finally {
      setSummarizing(false);
      setSaving(false);
    }
  }

  async function summarizeDraft() {
    await completeRecord();
  }

  async function saveDraft() {
    if (!draft || !activeMode || !activeModeDefinition || !sessionId || saving) return;

    setSaving(true);

    try {
      const entry = await saveChatSessionEntry(sessionId);
      router.push(`/entries/${entry.id}`);
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "保存失败", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function resetChat() {
    setSessionId(null);
    setActiveMode(null);
    setMessages([]);
    setDraft(null);
    setInput("");
    router.replace("/record");
  }

  async function endChat() {
    const hasUserContent = messages.some((message) => message.role === "user");
    if (hasUserContent && sessionId) {
      await completeRecord({ autoSave: true });
      return;
    }

    resetChat();
  }

  return (
    <AppShell>
      <section className={`mx-auto flex h-full min-h-0 w-full flex-col ${activeMode ? "max-w-6xl" : "max-w-6xl overflow-y-auto"}`}>
        {!activeMode ? (
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1 text-sm font-semibold text-[#875cff] shadow-button">
                <Sparkles size={16} /> 和 Moodial 说说
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-[#11163d]">先选一个最接近现在的感觉</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#777299]">不用判断得很准确，选一个靠近的入口就行。Moodial 会先陪你说几句，再把内容整理成日记。</p>
            </div>
            <button
              className="moodial-button inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              onClick={() => startChat("messy")}
              type="button"
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
              {loading ? "正在开始" : "直接开始"}
            </button>
          </div>
        ) : null}

        {loading && !activeMode ? (
          <div className="moodial-glass rounded-[2rem] p-8 text-sm text-[#777299]">正在把这次记录拿出来...</div>
        ) : activeMode ? (
          <div className="moodial-glass flex min-h-0 flex-1 flex-col rounded-[1.75rem] p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="moodial-mascot scale-[0.45]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#875cff]">{companion.title} / Moodial 正在陪你整理</p>
                  <h2 className="truncate text-xl font-bold text-[#11163d]">{activeModeDefinition?.label}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/72 px-4 text-sm text-[#6f61a0] shadow-button hover:text-[#875cff]" onClick={resetChat} type="button">
                  <ArrowLeft size={16} />
                  换一种入口
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/72 px-4 text-sm text-[#6f61a0] shadow-button hover:text-[#875cff]" onClick={endChat} type="button">
                  <X size={16} />
                  结束
                </button>
              </div>
            </div>
            <ChatComposer
              draft={draft}
              input={input}
              messages={messages}
              onInputChange={setInput}
              onSave={saveDraft}
              onSend={sendMessage}
              onSummarize={summarizeDraft}
              sending={sending || summarizing}
              saving={saving}
            />
            {saving || summarizing ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#777299]">
                <Loader2 className="animate-spin" size={16} />
                {saving ? "正在保存到数据库..." : "正在整理这次记录..."}
              </p>
            ) : null}
          </div>
        ) : (
          <div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {emotionModes.map((mode) => (
                <EmotionModeCard key={mode.id} mode={mode} onSelect={() => startChat(mode.id)} />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(Object.keys(companionModes) as CompanionMode[]).map((mode) => (
                <button
                  className={`h-10 rounded-full px-4 text-sm shadow-button transition ${
                    companionMode === mode ? "bg-[#875cff] text-white" : "bg-white/70 text-[#6f61a0] hover:text-[#875cff]"
                  }`}
                  key={mode}
                  onClick={() => setCompanionMode(mode)}
                  type="button"
                >
                  {companionModes[mode].title}
                </button>
              ))}
            </div>
            <div className="moodial-soft-panel mt-6 grid gap-5 rounded-[1.7rem] p-5 shadow-gentle lg:grid-cols-[160px_1fr]">
              <div className="flex items-center justify-center">
                <span className="moodial-mascot" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#11163d]">不用一开始就讲清楚。</h3>
                <p className="mt-3 text-sm leading-7 text-[#777299]">你可以吐槽、停顿、反复说，Moodial 会把散落的情绪、事件和需求慢慢收拢成一篇可以回看的日记。</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function detectCloseAction(content: string): "draft" | "save" | null {
  const normalized = content.replace(/\s/g, "");
  if (/^(没有了|没了|没啥了|不用了|就这样|就这样吧|可以了|结束吧|退出吧|保存|保存吧|存一下|存起来|记录下来|记下来|归档)$/.test(normalized)) return "save";
  if (/^(提前结束|先整理|整理一下|整理吧|生成日记|写成日记)$/.test(normalized)) return "draft";
  return null;
}
