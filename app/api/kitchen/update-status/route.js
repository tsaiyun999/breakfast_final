import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { getMqttClient } from "../../../../lib/mqttClient";

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "缺少 orderId 或 status" },
        { status: 400 }
      );
    }

    const updateData = { status };
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    // 更新狀態
    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // 再次查詢完整訂單（含 customer.name）
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
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
    });

    // 發送 MQTT
    const mqttClient = getMqttClient();

    if (mqttClient.connected) {
      mqttClient.publish(
        `U1113007/kitchen/updated/${orderId}`,
        JSON.stringify(fullOrder)
      );
      console.log("📤 發送 MQTT 訂單：", fullOrder);
    } else {
      console.warn("MQTT 尚未連線，跳過發送");
    }

    return NextResponse.json(fullOrder);
  } catch (err) {
    console.error("❌ 更新訂單狀態失敗:", err);
    return NextResponse.json(
      { error: "更新訂單狀態時發生錯誤", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}



