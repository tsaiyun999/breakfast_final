import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

const validStatuses = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const statusParam = searchParams.get("status");

    const where = {};

    
    if (userId) {
      where.customerId = userId;
    }

    
    if (statusParam) {
      const statusList = statusParam
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s) => validStatuses.includes(s));

      if (statusList.length === 0) {
        return NextResponse.json({ error: `無效的狀態: ${statusParam}` }, { status: 400 });
      }

      where.status = { in: statusList };
    }

    const orders = await prisma.order.findMany({
  where,
  include: {
    customer: {
      select: {
        id: true,
        name: true,
      },
    },
    items: {
      include: {
        menuItem: true,
      },
    },
  },
});

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("❌ API 錯誤:", err);
    return NextResponse.json({ error: "伺服器錯誤", detail: `${err}` }, { status: 500 });
  }
}
