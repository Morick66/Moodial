"use client";

import type { ChatMessage, DraftDiary } from "@jzmle/core";
import { useEffect, useRef } from "react";
import { Loader2, Save, Send, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function ChatComposer({
  draft,
  input,
  messages,
  onInputChange,
  onSave,
  onSend,
  onSummarize,
  sending = false,
  saving = false
}: {
  draft: DraftDiary | null;
  input: string;
  messages: ChatMessage[];
  onInputChange: (value: string) => void;
  onSave: () => void;
  onSend: () => void;
  onSummarize: () => void;
  sending?: boolean;
  saving?: boolean;
}) {
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const hasStreamingAssistant = messages.some((message) => message.id.startsWith("streaming-"));

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, draft]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.6rem] border border-white/75 bg-white/54 shadow-gentle backdrop-blur">
      <div ref={messagesRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div className={`flex ${isUser ? "justify-end" : "justify-start"}`} key={message.id}>
              <div className={`max-w-[82%] ${isUser ? "text-right" : ""}`}>
                <div
                  className={`rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
                    isUser
                      ? "bg-gradient-to-br from-[#7d55ff] to-[#c67dff] text-white shadow-[0_12px_26px_rgba(126,85,255,0.22)]"
                      : "border border-white/80 bg-white/88 text-[#23264f] shadow-[0_10px_30px_rgba(112,86,172,0.08)]"
                  }`}
                >
                  {message.content || (!isUser && message.id.startsWith("streaming-") ? "正在回复..." : "")}
                </div>
                {!isUser && message.source && message.content ? (
                  <p className="mt-1 px-2 text-[11px] leading-5 text-dusk/70" title={message.sourceNote}>
                    {message.source === "ai" ? "AI 回复" : "旧会话回复"}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
        {sending && !hasStreamingAssistant ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-3 text-sm text-[#81799d]">
              <Loader2 className="animate-spin" size={16} />
              正在等回复
            </div>
          </div>
        ) : null}
      </div>

      {draft ? (
        <div className="border-t border-[#e6dcff] px-4 py-4 sm:px-6">
          <DraftPreview draft={draft} onSave={onSave} saving={saving} />
        </div>
      ) : null}

      <div className="shrink-0 border-t border-[#e6dcff] bg-white/78 px-4 py-3 backdrop-blur sm:px-6">
        <textarea
          className="min-h-24 w-full resize-none rounded-[1.2rem] border border-[#e6dcff] bg-white/90 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#8b61ff]/45"
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              onSend();
            }
          }}
          placeholder="随便说几句就好，不用整理完整。"
          value={input}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#8a83a4]">按 Cmd/Ctrl + Enter 发送。不想继续时，可以说「没有了」。</span>
          <div className="flex gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white/76 px-4 text-sm text-[#6f61a0] shadow-button disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || sending}
              onClick={onSummarize}
              type="button"
            >
              <Sparkles size={17} />
              提前结束
            </button>
            <button
              className="moodial-button inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || sending}
              onClick={onSend}
              type="button"
            >
              {sending ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
              {sending ? "发送中" : "发送"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftPreview({ draft, onSave, saving }: { draft: DraftDiary; onSave: () => void; saving: boolean }) {
  return (
    <div className="rounded-[1.5rem] border border-[#e8ddff] bg-gradient-to-br from-white to-[#fff4fa] p-4 shadow-button">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#875cff]">已生成日记草稿</p>
          <h3 className="mt-1 font-bold text-[#11163d]">{draft.title}</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#6f688c]">{draft.diaryText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
        <button
          className="moodial-button inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          onClick={onSave}
          type="button"
        >
          {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
          {saving ? "保存中" : "保存日记"}
        </button>
      </div>
    </div>
  );
}
