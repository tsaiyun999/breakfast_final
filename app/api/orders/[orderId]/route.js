import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { getMqttClient } from "../../../../lib/mqttClient";

// PATCH：更新付款狀態
export async function PATCH(req, context) {
  try {
    const { orderId } = context.params;
    const body = await req.json();

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: body.paymentStatus,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customer: true,
      },
    });

    // 發送 MQTT 訊息通知付款狀態更新
    const mqttClient = getMqttClient();
    mqttClient.publish(
      `U1113007/orders/updated/${orderId}`,
      JSON.stringify({
        action: "paymentUpdated",
        order: updatedOrder,
      })
    );

    return NextResponse.json(updatedOrder);
  } catch (err) {
    console.error("❌ 更新付款狀態失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// GET：取得特定訂單（含 customer 與 menuItem 資訊）【可選用於未來擴充】
export async function GET(req, context) {
  const { id } = context.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: true },
        },
        customer: true,
      },
    });

    if (!order) {
      return new Response(
        JSON.stringify({ error: "找不到訂單" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ order }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "伺服器錯誤" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
