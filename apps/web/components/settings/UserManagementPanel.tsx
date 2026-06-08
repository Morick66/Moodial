"use client";

import { useState } from "react";
import { Loader2, RotateCcw, ShieldOff, Trash2, UserPlus, Users } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { fetchUsers, updateUserStatus, type ManagedUser } from "@/lib/user-api";
import type { SettingsContext } from "@/components/settings/settings-types";
import { SettingsCard, SettingsField } from "@/components/settings/SettingsPrimitives";

export function UserManagementPanel({ context }: { context: SettingsContext }) {
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [userBusyId, setUserBusyId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingUser(true);

    try {
      const response = await fetch("/api/users", {
        body: JSON.stringify({
          displayName: newDisplayName,
          password: newPassword,
          username: newUsername
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const body = (await response.json().catch(() => null)) as { displayName?: string | null; error?: string; username?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "创建用户失败");

      showToast({ message: `已创建用户 ${body?.displayName || body?.username || newUsername}。`, type: "success" });
      setNewUsername("");
      setNewDisplayName("");
      setNewPassword("");
      context.setManagedUsers(await fetchUsers());
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "创建用户失败", type: "error" });
    } finally {
      setCreatingUser(false);
    }
  }

  async function changeUserStatus(id: string, status: ManagedUser["status"]) {
    setUserBusyId(id);

    try {
      const nextUser = await updateUserStatus(id, status);
      context.setManagedUsers(context.managedUsers.map((user) => (user.id === id ? nextUser : user)));
      showToast({ message: "用户状态已更新。", type: "success" });
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "修改用户状态失败", type: "error" });
    } finally {
      setUserBusyId(null);
    }
  }

  return (
    <SettingsCard description="首版采用管理员手动创建账号的邀请制，不开放公开注册。" icon={<Users size={18} />} title="成员管理">
      <form onSubmit={createUser}>
        <div className="grid gap-4 lg:grid-cols-3">
          <SettingsField disabled={creatingUser} label="用户名" onChange={setNewUsername} placeholder="friend_01" value={newUsername} />
          <SettingsField disabled={creatingUser} label="显示名" onChange={setNewDisplayName} placeholder="可留空" value={newDisplayName} />
          <SettingsField disabled={creatingUser} label="初始密码" onChange={setNewPassword} placeholder="至少 8 位" type="password" value={newPassword} />
        </div>

        <button
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
          disabled={creatingUser}
          type="submit"
        >
          {creatingUser ? <Loader2 className="animate-spin" size={17} /> : <UserPlus size={17} />}
          {creatingUser ? "创建中" : "创建用户"}
        </button>
      </form>
      <div className="mt-6 border-t border-white/80 pt-5">
        <div className="grid gap-2">
          {context.managedUsers.map((user) => {
            const isSelf = user.id === context.me?.account?.id;
            return (
              <div className="flex flex-col gap-3 rounded-2xl bg-white/65 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" key={user.id}>
                <div>
                  <p className="text-sm font-medium text-ink">{user.displayName || user.username}</p>
                  <p className="mt-1 text-xs text-dusk">
                    @{user.username} / {user.role === "ADMIN" ? "管理员" : "普通用户"} / {user.status}
                  </p>
                  <p className="mt-1 text-xs text-dusk">创建于 {user.createdAt.slice(0, 10)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.status === "ACTIVE" ? (
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-white/80 px-3 text-xs text-rosewood shadow-button disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSelf || user.role === "ADMIN" || userBusyId === user.id}
                      onClick={() => changeUserStatus(user.id, "DISABLED")}
                      type="button"
                    >
                      <ShieldOff size={15} />
                      禁用
                    </button>
                  ) : user.status === "DISABLED" ? (
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-white/80 px-3 text-xs text-moss shadow-button disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSelf || user.role === "ADMIN" || userBusyId === user.id}
                      onClick={() => changeUserStatus(user.id, "ACTIVE")}
                      type="button"
                    >
                      <RotateCcw size={15} />
                      启用
                    </button>
                  ) : null}
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-blush px-3 text-xs text-rosewood shadow-button disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSelf || user.role === "ADMIN" || user.status === "DELETED" || userBusyId === user.id}
                    onClick={() => changeUserStatus(user.id, "DELETED")}
                    type="button"
                  >
                    <Trash2 size={15} />
                    删除
                  </button>
                  <button
                    className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-full bg-white/60 px-3 text-xs text-dusk opacity-60 shadow-button"
                    disabled
                    title="密码重置会在后续版本开放"
                    type="button"
                  >
                    重置密码
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 rounded-2xl bg-white/55 px-4 py-3 text-sm leading-6 text-dusk">
          邀请链接、角色调整和密码重置会作为下一步成员管理增强；当前版本先使用管理员手动创建账号。
        </p>
      </div>
    </SettingsCard>
  );
}
