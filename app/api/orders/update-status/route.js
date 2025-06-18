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

    const allowedStatuses = ["PENDING", "PREPARING", "COMPLETED"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `不合法的狀態值：${status}` },
        { status: 400 }
      );
    }

    const updateData = { status };
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    // MQTT 發送（確保連線）
    const mqttClient = getMqttClient();
    const topic = `U1113007/kitchen/updated/${orderId}`;
    const payload = JSON.stringify(fullOrder);

    if (mqttClient.connected) {
      mqttClient.publish(topic, payload);
      console.log("📤 MQTT 訊息已發送：", topic);
    } else {
      console.warn("⏳ MQTT 尚未連線，等待連線後發送：", topic);
      mqttClient.once("connect", () => {
        mqttClient.publish(topic, payload);
        console.log("📤 (延遲) MQTT 訊息已發送：", topic);
      });
    }

    return NextResponse.json(fullOrder);
  } catch (err) {
    console.error("❌ 更新訂單狀態失敗:", err);
    return NextResponse.json(
      { error: "更新訂單狀態時發生錯誤" },
      { status: 500 }
    );
  }
}
