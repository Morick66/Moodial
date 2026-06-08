"use client";

import { useState } from "react";
import { Loader2, Save, Upload, UserRound } from "lucide-react";
import { AvatarView } from "@/components/avatar/AvatarView";
import { useToast } from "@/components/toast/ToastProvider";
import { updateMe, uploadMyAvatar, type UserAvatarPreference } from "@/lib/me-api";
import type { SettingsContext } from "@/components/settings/settings-types";
import { SettingsCard, SettingsField } from "@/components/settings/SettingsPrimitives";

const avatarColors = [
  { label: "玫瑰", value: "rosewood" },
  { label: "苔绿", value: "moss" },
  { label: "陶土", value: "clay" },
  { label: "雾灰", value: "dusk" }
];

const avatarIcons = [
  { label: "星光", value: "spark" },
  { label: "月亮", value: "moon" },
  { label: "叶子", value: "leaf" },
  { label: "波纹", value: "wave" }
];

export function ProfileSettings({ context }: { context: SettingsContext }) {
  const account = context.me?.account;
  const initialAvatar = context.me?.preferences.avatar ?? { color: "rosewood", icon: "spark", initial: "", type: "style" as const };
  const [displayName, setDisplayName] = useState(account?.displayName || account?.username || "");
  const [aiDisplayName, setAiDisplayName] = useState(context.me?.preferences.aiDisplayName || "");
  const [avatar, setAvatar] = useState<UserAvatarPreference>(initialAvatar);
  const [avatarType, setAvatarType] = useState<UserAvatarPreference["type"]>(initialAvatar.type);
  const [avatarInitial, setAvatarInitial] = useState(initialAvatar.type === "style" ? initialAvatar.initial : "");
  const [avatarColor, setAvatarColor] = useState(initialAvatar.type === "style" ? initialAvatar.color : "rosewood");
  const [avatarIcon, setAvatarIcon] = useState(initialAvatar.type === "style" ? initialAvatar.icon : "spark");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar.type === "url" ? initialAvatar.url : "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !context.me) return;

    setSaving(true);
    try {
      const nextAvatar = buildAvatarPreference();
      const updated = await updateMe({ aiDisplayName, avatar: nextAvatar, displayName });
      context.setMe({
        ...context.me,
        account: updated.account,
        preferences: updated.preferences
      });
      setAvatar(updated.preferences.avatar);
      window.dispatchEvent(new Event("moodial:me-updated"));
      showToast({ message: "个人设置已保存。", type: "success" });
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "保存个人设置失败", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !context.me) return;

    setUploading(true);
    try {
      const uploadedAvatar = await uploadMyAvatar(file);
      setAvatar(uploadedAvatar);
      setAvatarType("upload");
      context.setMe({
        ...context.me,
        preferences: {
          ...context.me.preferences,
          avatar: uploadedAvatar
        }
      });
      window.dispatchEvent(new Event("moodial:me-updated"));
      showToast({ message: "头像已上传。", type: "success" });
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "上传头像失败", type: "error" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function buildAvatarPreference(): UserAvatarPreference {
    if (avatarType === "url") {
      return { type: "url", url: avatarUrl };
    }
    if (avatarType === "upload" && avatar.type === "upload") {
      return avatar;
    }

    return {
      color: avatarColor,
      icon: avatarIcon,
      initial: avatarInitial,
      type: "style"
    };
  }

  return (
    <SettingsCard
      description="这些信息只影响当前账号。AI 称呼会进入对话上下文，用来告诉模型如何自然地称呼你。"
      icon={<UserRound size={18} />}
      title="个人设置"
    >
      <form onSubmit={saveProfile}>
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white/55 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <AvatarView avatar={buildAvatarPreference()} fallbackName={displayName || account?.username || "Moodial"} size="lg" />
            <div>
              <p className="text-sm font-medium text-ink">头像</p>
              <p className="mt-1 text-sm leading-6 text-dusk">可以用样式头像、上传图片或外链图片。</p>
            </div>
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-white/80 px-4 text-sm text-rosewood shadow-button">
            {uploading ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}
            {uploading ? "上传中" : "上传图片"}
            <input accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading} onChange={uploadAvatar} type="file" />
          </label>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["style", "upload", "url"] as const).map((type) => (
            <button
              className={`h-10 rounded-full px-4 text-sm shadow-button transition ${avatarType === type ? "bg-rosewood text-white" : "bg-white/70 text-dusk hover:text-rosewood"}`}
              key={type}
              onClick={() => setAvatarType(type)}
              type="button"
            >
              {type === "style" ? "样式头像" : type === "upload" ? "上传头像" : "外链头像"}
            </button>
          ))}
        </div>

        {avatarType === "style" ? (
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <SettingsField disabled={saving} label="头像文字" onChange={setAvatarInitial} placeholder="可留空，默认取首字" value={avatarInitial} />
            <label className="grid gap-2 text-sm text-dusk">
              头像颜色
              <select className="h-11 rounded-2xl border border-white/80 bg-white/80 px-4 text-ink outline-none" onChange={(event) => setAvatarColor(event.target.value)} value={avatarColor}>
                {avatarColors.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-dusk">
              预设图标
              <select className="h-11 rounded-2xl border border-white/80 bg-white/80 px-4 text-ink outline-none" onChange={(event) => setAvatarIcon(event.target.value)} value={avatarIcon}>
                {avatarIcons.map((icon) => (
                  <option key={icon.value} value={icon.value}>
                    {icon.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {avatarType === "url" ? (
          <div className="mb-6">
            <SettingsField disabled={saving} label="头像图片 URL" onChange={setAvatarUrl} placeholder="https://..." value={avatarUrl} />
          </div>
        ) : null}

        {avatarType === "upload" && avatar.type !== "upload" ? <p className="mb-6 rounded-2xl bg-white/65 px-4 py-3 text-sm text-dusk">还没有上传头像。请先选择图片上传。</p> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <SettingsField disabled={saving} label="显示名" onChange={setDisplayName} placeholder="在界面中显示的名称" value={displayName} />
          <SettingsField disabled={saving} label="AI 称呼你为" onChange={setAiDisplayName} placeholder="例如：小莫、Morick、阿木" value={aiDisplayName} />
        </div>

        <div className="mt-4 rounded-2xl bg-white/65 px-4 py-3 text-sm leading-6 text-dusk">
          当前账号：@{account?.username ?? "读取中"} / {account?.role === "ADMIN" ? "管理员" : "普通用户"} / {account?.status ?? "读取中"}
        </div>

        <button
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || !account}
          type="submit"
        >
          {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
          {saving ? "保存中" : "保存个人设置"}
        </button>
      </form>
    </SettingsCard>
  );
}
