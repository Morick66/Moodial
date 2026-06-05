"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { emotionModes, type ChatMessage, type DraftDiary, type EmotionModeId } from "@jzmle/core";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { EmotionModeCard } from "@/components/diary/EmotionModeCard";
import { appendUserChatMessage, createChatSession, fetchChatSession, saveChatSessionEntry, streamChatMessage, summarizeChatSession } from "@/lib/chat-session-api";

export function RecordWorkspace({ initialSessionId }: { initialSessionId?: string }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [activeMode, setActiveMode] = useState<EmotionModeId | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<DraftDiary | null>(null);
  const [loading, setLoading] = useState(Boolean(initialSessionId));
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeModeDefinition = useMemo(() => (activeMode ? emotionModes.find((mode) => mode.id === activeMode) : null), [activeMode]);

  useEffect(() => {
    if (!initialSessionId) return;
    const restoreSessionId = initialSessionId;
    let cancelled = false;

    async function loadSession() {
      setLoading(true);
      setError("");

      try {
        const session = await fetchChatSession(restoreSessionId);
        if (cancelled) return;
        setSessionId(session.id);
        setActiveMode(session.mode);
        setMessages(session.messages);
        setDraft(session.draft);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "无法恢复这次记录");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [initialSessionId]);

  async function startChat(mode: EmotionModeId) {
    setLoading(true);
    setDraft(null);
    setInput("");
    setError("");

    try {
      const session = await createChatSession(mode);
      setSessionId(session.id);
      setActiveMode(session.mode);
      setMessages(session.messages);
      setDraft(session.draft);
      router.replace(`/record?session=${session.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法开始记录");
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
    setError("");
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
      setError(cause instanceof Error ? cause.message : "发送失败");
    } finally {
      setSending(false);
    }
  }

  async function completeRecord({ autoSave = false }: { autoSave?: boolean } = {}) {
    if (!sessionId || summarizing) return;

    setSummarizing(true);
    setError("");

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
      setError(cause instanceof Error ? cause.message : autoSave ? "整理保存失败" : "整理失败");
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
    setError("");

    try {
      const entry = await saveChatSessionEntry(sessionId);
      router.push(`/entries/${entry.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
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
    setError("");
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
      <section className={`mx-auto flex h-full min-h-0 w-full flex-col ${activeMode ? "max-w-6xl" : "max-w-5xl overflow-y-auto"}`}>
        {!activeMode ? (
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-dusk">情绪入口</p>
              <h2 className="mt-1 text-3xl font-semibold">先选一个最接近现在的感觉</h2>
            </div>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
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
          <div className="rounded-[2rem] border border-white/80 bg-white/65 p-8 text-sm text-dusk shadow-gentle">正在把这次记录拿出来...</div>
        ) : activeMode ? (
          <div className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-white/80 bg-white/65 p-4 shadow-gentle backdrop-blur sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-dusk">正在记录</p>
                <h2 className="truncate text-xl font-semibold">{activeModeDefinition?.label}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-sm text-dusk shadow-button hover:text-rosewood" onClick={resetChat} type="button">
                  <ArrowLeft size={16} />
                  换一种入口
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-sm text-dusk shadow-button hover:text-rosewood" onClick={endChat} type="button">
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
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-dusk">
                <Loader2 className="animate-spin" size={16} />
                {saving ? "正在保存到数据库..." : "正在整理这次记录..."}
              </p>
            ) : null}
            {error ? <p className="mt-3 rounded-2xl bg-blush/60 px-4 py-3 text-sm text-clay">{error}</p> : null}
          </div>
        ) : (
          <div>
            <p className="mb-5 max-w-2xl text-sm leading-7 text-dusk">不用判断得很准确，选一个靠近的入口就行。它只是帮你开个头，不会给你贴标签。</p>
            {error ? <p className="mb-5 rounded-[1.25rem] bg-blush px-4 py-3 text-sm text-clay">{error}</p> : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {emotionModes.map((mode) => (
                <EmotionModeCard key={mode.id} mode={mode} onSelect={() => startChat(mode.id)} />
              ))}
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
