import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function POST(request, { params }) {
  const userId = params.userId;
  const body = await request.json();
  const { orderItems } = body;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return NextResponse.json({ error: "缺少訂單內容" }, { status: 400 });
  }

  try {
    const totalAmount = await Promise.all(
      orderItems.map(async (item) => {
        const menu = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
        return (menu?.price || 0) * item.quantity;
      })
    ).then((values) => values.reduce((acc, val) => acc + val, 0));

    const newOrder = await prisma.order.create({
      data: {
        customerId: userId,
        status: "PREPARING",              // 自動設定為製作中
        paymentStatus: false,             // 店員尚未確認
        totalAmount,
        items: {
          create: orderItems.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            specialRequest: item.specialRequest || "",
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(newOrder);
  } catch (err) {
    console.error("❌ 訂單建立失敗：", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
