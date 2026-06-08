export type HomeGreeting = {
  body: string;
  title: string;
};

export async function fetchHomeGreeting() {
  const response = await fetch("/api/home/greeting", { cache: "no-store" });
  if (!response.ok) throw new Error("无法读取首页问候");
  return (await response.json()) as HomeGreeting;
}
