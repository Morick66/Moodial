"use client";

import { useState } from "react";
import { KeyRound, Loader2, Save, Sparkles } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { saveAiSettings, testAiSettings } from "@/lib/ai-settings-api";
import type { SettingsContext } from "@/components/settings/settings-types";
import { SettingsCard, SettingsField } from "@/components/settings/SettingsPrimitives";

const providerPresets = [
  { baseUrl: "https://api.openai.com/v1", label: "OpenAI", model: "gpt-4o-mini" },
  { baseUrl: "https://api.moonshot.cn/v1", label: "Moonshot/Kimi", model: "moonshot-v1-8k" },
  { baseUrl: "http://localhost:11434/v1", label: "本地 Ollama", model: "qwen2.5:7b" }
];

export function AiSettingsPanel({ context }: { context: SettingsContext }) {
  const [aiBaseUrl, setAiBaseUrl] = useState(context.aiSettings?.baseUrl ?? "");
  const [aiModel, setAiModel] = useState(context.aiSettings?.model ?? "");
  const [aiKey, setAiKey] = useState("");
  const [aiBusy, setAiBusy] = useState<"save" | "test" | null>(null);
  const { showToast } = useToast();

  async function saveAiConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAiBusy("save");

    try {
      const nextSettings = await saveAiSettings({
        apiKey: aiKey,
        baseUrl: aiBaseUrl,
        model: aiModel,
        provider: "openai_compatible"
      });
      context.setAiSettings(nextSettings);
      setAiKey("");
      showToast({ message: "AI 配置已保存。", type: "success" });
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "保存 AI 配置失败", type: "error" });
    } finally {
      setAiBusy(null);
    }
  }

  async function testAiConfig() {
    setAiBusy("test");

    try {
      await testAiSettings({
        apiKey: aiKey,
        baseUrl: aiBaseUrl,
        model: aiModel,
        provider: "openai_compatible"
      });
      showToast({ message: "AI 连接测试成功。", type: "success" });
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "AI 连接测试失败", type: "error" });
    } finally {
      setAiBusy(null);
    }
  }

  return (
    <SettingsCard
      description="第一版支持 OpenAI-Compatible Chat Completions。API Key 只保存在服务端，并会加密写入数据库。"
      icon={<KeyRound size={18} />}
      title="AI 配置"
    >
      <form onSubmit={saveAiConfig}>
        <div className="mb-5 flex flex-wrap gap-2">
          {providerPresets.map((preset) => (
            <button
              className="inline-flex h-9 items-center rounded-full bg-white/70 px-3 text-xs text-rosewood shadow-button"
              key={preset.label}
              onClick={() => {
                setAiBaseUrl(preset.baseUrl);
                setAiModel(preset.model);
              }}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <SettingsField disabled={Boolean(aiBusy)} label="Base URL" onChange={setAiBaseUrl} placeholder="https://api.openai.com/v1" value={aiBaseUrl} />
          <SettingsField disabled={Boolean(aiBusy)} label="Model" onChange={setAiModel} placeholder="gpt-4o-mini" value={aiModel} />
          <SettingsField
            disabled={Boolean(aiBusy)}
            label={context.aiSettings?.hasApiKey ? "API Key（留空则不修改）" : "API Key"}
            onChange={setAiKey}
            placeholder={context.aiSettings?.hasApiKey ? "已保存，输入新 Key 可替换" : "sk-..."}
            type="password"
            value={aiKey}
          />
        </div>
        <p className="mt-3 rounded-2xl bg-white/60 px-4 py-3 text-sm leading-6 text-dusk">
          本地模型可使用 OpenAI-Compatible 代理地址。保存后建议点击测试，确认模型能返回回复。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
            disabled={Boolean(aiBusy)}
            type="submit"
          >
            {aiBusy === "save" ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            保存配置
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-sm text-rosewood shadow-button disabled:cursor-not-allowed disabled:opacity-60"
            disabled={Boolean(aiBusy) || !context.aiSettings?.configured}
            onClick={testAiConfig}
            type="button"
          >
            {aiBusy === "test" ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
            测试当前填写
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
