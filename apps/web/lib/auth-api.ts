import { authClient } from "@/lib/auth-client";

export async function signInWithUsername(input: { password: string; username: string }) {
  const result = await authClient.signIn.username({
    username: input.username,
    password: input.password
  });

  if (result.error) {
    throw new Error(result.error.message ?? "登录失败");
  }

  return result.data;
}

export async function signOut() {
  await authClient.signOut();
}
