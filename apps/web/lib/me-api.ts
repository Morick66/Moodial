export type MeStatus = {
  account: {
    displayName: string | null;
    id: string;
    role: "ADMIN" | "USER";
    status: string;
    username: string;
  } | null;
  authenticated: boolean;
  preferences: {
    aiDisplayName: string;
    avatar: UserAvatarPreference;
  };
};

export type UserAvatarPreference =
  | {
      color: string;
      icon: string;
      initial: string;
      type: "style";
    }
  | {
      type: "url";
      url: string;
    }
  | {
      contentType: string;
      file: string;
      type: "upload";
      url: string;
    };

export async function fetchMe() {
  const response = await fetch("/api/me", { cache: "no-store" });
  if (!response.ok) throw new Error("无法读取当前账号");
  return (await response.json()) as MeStatus;
}

export async function updateMe(input: { aiDisplayName: string; avatar?: UserAvatarPreference; displayName: string }) {
  const response = await fetch("/api/me", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "PATCH"
  });
  const body = (await response.json().catch(() => null)) as Partial<MeStatus> & { error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "保存个人设置失败");
  if (!body?.account || !body.preferences) throw new Error("个人设置响应异常");

  return {
    account: body.account,
    preferences: body.preferences
  };
}

export async function uploadMyAvatar(file: File) {
  const form = new FormData();
  form.set("file", file);

  const response = await fetch("/api/me/avatar", {
    body: form,
    method: "POST"
  });
  const body = (await response.json().catch(() => null)) as { avatar?: UserAvatarPreference; error?: string } | null;
  if (!response.ok || !body?.avatar) throw new Error(body?.error ?? "上传头像失败");

  return body.avatar;
}
