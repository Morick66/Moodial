import { spawn } from "node:child_process";

const projectName = process.env.DOCKER_VERIFY_PROJECT ?? "moodial_verify";
const appPort = process.env.DOCKER_VERIFY_APP_PORT ?? "3010";
const postgresPort = process.env.DOCKER_VERIFY_POSTGRES_PORT ?? "55432";
const baseUrl = `http://127.0.0.1:${appPort}`;
const username = `verify_admin_${Date.now()}`;
const password = "MoodialVerifyPass123!";

const dockerEnv = {
  ...process.env,
  APP_PORT: appPort,
  APP_URL: baseUrl,
  APP_CONTAINER_NAME: `${projectName}-app`,
  DATABASE_URL: "postgresql://jzmle:change-me@postgres:5432/jzmle?schema=public",
  DOCKER_BUILDKIT: process.env.DOCKER_BUILDKIT ?? "1",
  NO_PROXY: mergeNoProxy(process.env.NO_PROXY ?? process.env.no_proxy),
  POSTGRES_DB: "jzmle",
  POSTGRES_PASSWORD: "change-me",
  POSTGRES_CONTAINER_NAME: `${projectName}-postgres`,
  POSTGRES_PORT: postgresPort,
  POSTGRES_USER: "jzmle",
  no_proxy: mergeNoProxy(process.env.no_proxy ?? process.env.NO_PROXY)
};

const cookieJar = new Map();

async function main() {
  console.log(`Starting isolated Docker MVP verification: ${projectName}`);
  await compose(["down", "-v", "--remove-orphans"]);
  await compose(["build"]);
  await compose(["up", "-d"]);

  try {
    await waitForSetupStatus();
    await setupInstance();
    await signIn();
    const session = await createChatSession();
    await appendUserMessage(session.id);
    const summary = await summarizeSession(session.id);
    assert(summary.source === "fallback" || summary.source === "ai", "summary should include source");
    const entry = await saveEntry(session.id);
    await verifyEntryList(entry.id);
    await verifyEntryDetail(entry.id);
    await deleteEntry(entry.id);
    await verifyEntryDeleted(entry.id);

    console.log("Docker MVP verification passed.");
  } catch (cause) {
    console.error("\nDocker MVP verification failed.");
    if (cause instanceof Error) {
      console.error(cause.message);
    } else {
      console.error(cause);
    }
    await compose(["logs", "--no-color", "--tail=160", "app"], { ignoreFailure: true });
    process.exitCode = 1;
  } finally {
    if (process.env.KEEP_DOCKER_VERIFY_STACK === "true") {
      console.log(`Keeping Docker stack '${projectName}' running because KEEP_DOCKER_VERIFY_STACK=true.`);
    } else {
      await compose(["down", "-v", "--remove-orphans"], { ignoreFailure: true });
    }
  }
}

async function setupInstance() {
  const status = await api("/api/setup/status");
  if (status.initialized) return;

  const created = await api("/api/setup", {
    body: {
      displayName: "Docker MVP Verify",
      instanceName: "Moodial Docker Verify",
      password,
      username
    },
    method: "POST"
  });

  assert(created.initialized, "setup should initialize the instance");
}

async function signIn() {
  const body = await api("/api/auth/sign-in/username", {
    body: { password, username },
    method: "POST"
  });
  assert(body.user || body.token || cookieJar.size > 0, "sign-in should set an auth cookie");

  const me = await api("/api/me");
  assert(me.user?.username === username, "signed-in user should match verify admin");
}

async function createChatSession() {
  const session = await api("/api/chat-sessions", {
    body: { mode: "messy" },
    method: "POST"
  });

  assert(session.id, "chat session should have id");
  assert(session.messages?.length > 0, "chat session should include opening prompt");
  return session;
}

async function appendUserMessage(sessionId) {
  const result = await api(`/api/chat-sessions/${sessionId}/messages`, {
    body: {
      content: "今天脑子很乱，工作上的事和家里的事挤在一起。我有点累，也担心明天处理不好。",
      respond: false
    },
    method: "POST"
  });

  assert(result.session?.status === "ready_to_summarize", "session should be ready to summarize after closing message");
}

async function summarizeSession(sessionId) {
  const result = await api(`/api/chat-sessions/${sessionId}/summarize`, {
    method: "POST"
  });

  assert(result.draft?.diaryText, "summarize should return a diary draft");
  assert(result.session?.draft?.diaryText, "session should keep the draft");
  return result;
}

async function saveEntry(sessionId) {
  const entry = await api(`/api/chat-sessions/${sessionId}/entries`, {
    method: "POST"
  });

  assert(entry.id, "saved entry should have id");
  assert(entry.diaryText?.includes("今天"), "saved entry should include diary text");
  return entry;
}

async function verifyEntryList(entryId) {
  const entries = await api("/api/entries");
  assert(Array.isArray(entries), "entries should be a list");
  assert(entries.some((entry) => entry.id === entryId), "saved entry should appear in list");
}

async function verifyEntryDetail(entryId) {
  const entry = await api(`/api/entries/${entryId}`);
  assert(entry.id === entryId, "detail should return saved entry");
  assert(Array.isArray(entry.structured?.tags), "detail should include structured tags");
}

async function deleteEntry(entryId) {
  await api(`/api/entries/${entryId}`, {
    expectJson: false,
    expectedStatus: 204,
    method: "DELETE"
  });
}

async function verifyEntryDeleted(entryId) {
  const entries = await api("/api/entries");
  assert(!entries.some((entry) => entry.id === entryId), "deleted entry should disappear from list");
}

async function waitForSetupStatus() {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < 90000) {
    try {
      const status = await api("/api/setup/status", { useCookies: false });
      if (status.database === "connected") return status;
    } catch (cause) {
      lastError = cause;
    }
    await sleep(1500);
  }

  throw new Error(`Timed out waiting for setup status. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Origin: baseUrl,
      Referer: `${baseUrl}/`,
      ...(options.useCookies === false ? {} : { Cookie: serializeCookies() })
    },
    method: options.method ?? "GET"
  });

  storeCookies(response);

  const expectedStatus = options.expectedStatus ?? (options.method === "POST" ? [200, 201] : 200);
  const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${options.method ?? "GET"} ${path} returned ${response.status}: ${await response.text()}`);
  }

  if (options.expectJson === false) return null;
  return response.json();
}

function storeCookies(response) {
  const headers = response.headers;
  const setCookies = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : splitSetCookie(headers.get("set-cookie"));

  for (const cookie of setCookies) {
    const firstPart = cookie.split(";")[0];
    const separator = firstPart.indexOf("=");
    if (separator <= 0) continue;
    cookieJar.set(firstPart.slice(0, separator), firstPart.slice(separator + 1));
  }
}

function splitSetCookie(value) {
  if (!value) return [];
  return value.split(/,\s*(?=[^=;,]+=[^=;,]+)/);
}

function serializeCookies() {
  return Array.from(cookieJar.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function compose(args, options = {}) {
  return run("docker", ["compose", "-p", projectName, ...args], options);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: dockerEnv,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || options.ignoreFailure) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeNoProxy(value) {
  const current = value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  return Array.from(new Set([...current, "localhost", "127.0.0.1", "::1"])).join(",");
}

main();
