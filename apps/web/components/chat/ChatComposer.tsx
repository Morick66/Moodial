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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-rosewood/10 bg-paper/65">
      <div ref={messagesRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div className={`flex ${isUser ? "justify-end" : "justify-start"}`} key={message.id}>
              <div className={`max-w-[82%] ${isUser ? "text-right" : ""}`}>
                <div
                  className={`rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
                    isUser ? "bg-rosewood text-white" : "border border-white/80 bg-white/85 text-ink shadow-[0_10px_30px_rgba(112,86,72,0.05)]"
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
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-3 text-sm text-dusk">
              <Loader2 className="animate-spin" size={16} />
              正在等回复
            </div>
          </div>
        ) : null}
      </div>

      {draft ? (
        <div className="border-t border-rosewood/10 px-4 py-4 sm:px-6">
          <DraftPreview draft={draft} onSave={onSave} saving={saving} />
        </div>
      ) : null}

      <div className="shrink-0 border-t border-rosewood/10 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
        <textarea
          className="min-h-24 w-full resize-none rounded-[1.2rem] border border-white/80 bg-white/90 px-4 py-3 text-sm leading-6 outline-none transition focus:border-rosewood/30"
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
          <span className="text-xs text-dusk">按 Cmd/Ctrl + Enter 发送。不想继续时，可以说「没有了」。</span>
          <div className="flex gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-sm shadow-button disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || sending}
              onClick={onSummarize}
              type="button"
            >
              <Sparkles size={17} />
              提前结束
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="rounded-[1.5rem] border border-sage bg-sage/50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs text-moss">已生成草稿</p>
          <h3 className="mt-1 font-medium">{draft.title}</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-dusk">{draft.diaryText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
        <button
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
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
