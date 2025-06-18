import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { getMqttClient } from "../../../lib/mqttClient";

const mqttClient = getMqttClient();

//  建立新訂單
export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.userId || !body.orderItems || body.orderItems.length === 0) {
      return new Response("缺少必要資料", { status: 400 });
    }

    const newOrder = await prisma.order.create({
      data: {
        customerId: body.userId,
        totalAmount: body.totalAmount ?? 0,
        status: "PENDING",
        paymentStatus: false,
        completedAt: null,
        items: {
          create: body.orderItems.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            specialRequest: item.specialRequest || "",
          })),
        },
      },
        include: {
    items: {
      include: {
        menuItem: true, // ✅ 包含餐點名稱
      },
    },
    customer: true, // ✅ 包含顧客名稱
  },
});

    //  發送 MQTT 新訂單通知
    mqttClient.publish(
      "U1113007/orders/new/orders01",
      JSON.stringify(newOrder)
    );

    return NextResponse.json(newOrder);
  } catch (err) {
    console.error("❌ 建立訂單失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}



export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const statusFilter = url.searchParams.get("status")?.toUpperCase();

    let whereClause;

    if (userId) {
      // 顧客查詢邏輯
      whereClause = {
        customerId: userId,
        ...(statusFilter && statusFilter !== "ALL"
          ? { status: statusFilter }
          : {}),
      };
    } else {
      // 店員/廚師查詢邏輯（維持原本只抓未完成）
      whereClause =
        statusFilter === "COMPLETED"
          ? { status: "COMPLETED" }
          : { status: { not: "COMPLETED" } };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error("❌ 讀取訂單失敗:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: err.message },
      { status: 500 }
    );
  }
}
