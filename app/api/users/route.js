import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error("❌ 載入使用者失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
