import { prisma } from "@jzmle/db";
import type { UserPreferences } from "@/lib/server/user-preferences";

type GreetingInput = {
  userId: string;
  preferences: UserPreferences;
};

const quietGreetings = [
  {
    title: "今天想先从哪一点开始？",
    body: "不用完整，也不用解释清楚。先留下一句靠近当下的话，Moodial 会帮你慢慢整理。"
  },
  {
    title: "今天可以轻一点开始",
    body: "哪怕只是一个词、一个场景、一个身体感觉，都可以成为这篇日记的入口。"
  },
  {
    title: "把今天先放到这里",
    body: "不急着判断它好不好，也不急着总结。说几句，系统会帮你整理成可以回看的记录。"
  }
];

const activeGreetings = [
  {
    title: "今天也给自己留个位置",
    body: "最近你已经在持续记录了。今天可以继续从一个最明显的感觉开始。"
  },
  {
    title: "要不要接着整理今天？",
    body: "你前几天留下的线索还在这里。今天只需要补上一点新的感受。"
  },
  {
    title: "今天的情绪也值得被看见",
    body: "不需要写得漂亮。先说真实的一小段，Moodial 会帮你把它收成日记。"
  }
];

const steadyGreetings = [
  {
    title: "最近的你，已经留下不少线索",
    body: "今天可以继续记一点，也可以只把最重的那一小块先放下来。"
  },
  {
    title: "今天继续听听自己",
    body: "这周的记录正在形成脉络。再添一笔，之后回看会更容易看见变化。"
  },
  {
    title: "给今天一个温和的出口",
    body: "你不需要一次说完。先把最想被理解的部分交给这里。"
  }
];

export async function buildHomeGreeting(input: GreetingInput) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const entryCount = await prisma.diaryEntry.count({
    where: {
      userId: input.userId,
      deletedAt: null,
      date: {
        gte: start,
        lte: now
      }
    }
  });

  const pool = entryCount >= 4 ? steadyGreetings : entryCount > 0 ? activeGreetings : quietGreetings;
  const dateKey = now.toISOString().slice(0, 10);
  const greeting = pool[hashToIndex(`${input.userId}:${dateKey}:${entryCount}`, pool.length)];
  const name = input.preferences.aiDisplayName;

  return {
    title: name ? `${name}，${greeting.title}` : greeting.title,
    body: greeting.body
  };
}

function hashToIndex(value: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % modulo;
}
