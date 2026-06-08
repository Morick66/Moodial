import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://jzmle:change-me@localhost:5432/jzmle?schema=public";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl })
});

const userId = "verify-owner";
const title = `CRUD 验证 ${new Date().toISOString()}`;

async function main() {
  await prisma.userAccount.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      username: userId,
      displayName: "CRUD 验证用户",
      passwordHash: "verify-placeholder"
    }
  });

  const created = await prisma.diaryEntry.create({
    data: {
      userId,
      date: new Date(),
      mode: "MESSY",
      title,
      diaryText: "这是一篇用于验证数据库 CRUD 闭环的日记。",
      oneSentenceSummary: "验证创建日记。",
      structuredJson: {
        scenes: ["验证"],
        events: ["创建日记"],
        people: [],
        emotions: ["平静"],
        bodyState: [],
        trigger: [],
        automaticThoughts: [],
        coreFeeling: "确认系统可用",
        needs: [],
        actions: [],
        tags: ["crud"],
        safetyFlag: "none"
      },
      rawConversation: []
    }
  });

  const listed = await prisma.diaryEntry.findMany({
    where: { userId, deletedAt: null }
  });
  assert(listed.some((entry) => entry.id === created.id), "created entry should appear in list");

  const detail = await prisma.diaryEntry.findFirst({
    where: { id: created.id, userId, deletedAt: null }
  });
  assert(detail?.title === title, "detail should return created entry");

  const updated = await prisma.diaryEntry.update({
    where: { id: created.id },
    data: {
      title: `${title} updated`,
      diaryText: "更新后的 CRUD 验证正文。",
      oneSentenceSummary: "验证更新日记。",
      userEdited: true
    }
  });
  assert(updated.userEdited, "updated entry should be marked userEdited");

  await prisma.diaryEntry.update({
    where: { id: created.id },
    data: { deletedAt: new Date() }
  });

  const afterDeleteList = await prisma.diaryEntry.findMany({
    where: { userId, deletedAt: null }
  });
  assert(!afterDeleteList.some((entry) => entry.id === created.id), "soft deleted entry should not appear in list");

  const afterDeleteDetail = await prisma.diaryEntry.findFirst({
    where: { id: created.id, userId, deletedAt: null }
  });
  assert(afterDeleteDetail === null, "soft deleted entry detail should be null");

  console.log("Diary CRUD verification passed.");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main()
  .catch((error) => {
    console.error(error);
    console.error("\nDiary CRUD verification failed. Make sure PostgreSQL is running and migrations have been applied.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
