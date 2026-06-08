import { NextResponse } from "next/server";
import { getSetupStatus } from "@/lib/server/setup";

export async function GET() {
  try {
    return NextResponse.json(await getSetupStatus());
  } catch {
    return NextResponse.json(
      {
        database: "error",
        initialized: false,
        hasAdmin: false,
        instanceName: "",
        error: "数据库连接失败，请检查 DATABASE_URL 和 PostgreSQL 服务。"
      },
      { status: 503 }
    );
  }
}
