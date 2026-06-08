export interface SetupStatus {
  database: "connected" | "error";
  initialized: boolean;
  hasAdmin: boolean;
  instanceName: string;
  error?: string;
}

export async function fetchSetupStatus() {
  const response = await fetch("/api/setup/status", {
    cache: "no-store"
  });
  return (await response.json()) as SetupStatus;
}

export async function initializeInstance(input: {
  displayName: string;
  instanceName: string;
  password: string;
  username: string;
}) {
  const response = await fetch("/api/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const body = (await response.json()) as SetupStatus | { error: string };
  if (!response.ok) {
    throw new Error("error" in body ? body.error : "初始化失败");
  }

  return body as SetupStatus;
}

export async function updateInstanceName(instanceName: string) {
  const response = await fetch("/api/setup", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instanceName })
  });

  const body = (await response.json()) as SetupStatus | { error: string };
  if (!response.ok) {
    throw new Error("error" in body ? body.error : "保存实例名称失败");
  }

  return body as SetupStatus;
}
