import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

const validStatuses = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const statusParam = searchParams.get("status")?.trim();

    let statuses = [];

    if (statusParam) {
      statuses = statusParam
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s) => validStatuses.includes(s));
    }

    if (statuses.length === 0) {
      statuses = ["PENDING", "PREPARING", "READY"];
    }

    const orders = await prisma.order.findMany({
      where: {
        status: { in: statuses },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("❌ 查詢訂單失敗:", err);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}