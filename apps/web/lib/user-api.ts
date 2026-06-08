export type ManagedUser = {
  createdAt: string;
  displayName: string | null;
  id: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "DISABLED" | "DELETED";
  username: string;
};

export async function fetchUsers() {
  const response = await fetch("/api/users", {
    cache: "no-store"
  });
  if (!response.ok) throw new Error(await readError(response, "无法读取用户列表"));

  return (await response.json()) as ManagedUser[];
}

export async function updateUserStatus(id: string, status: ManagedUser["status"]) {
  const response = await fetch(`/api/users/${id}`, {
    body: JSON.stringify({ status }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH"
  });
  if (!response.ok) throw new Error(await readError(response, "修改用户状态失败"));

  return (await response.json()) as ManagedUser;
}

export async function deleteMyAccountData() {
  const response = await fetch("/api/me", {
    method: "DELETE"
  });
  if (!response.ok) throw new Error(await readError(response, "删除账号数据失败"));
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}
