// lib/kitchenMqttClient.js
import mqtt from "mqtt";

let client = null;

export function getKitchenMqttClient() {
  if (!client) {
    client = mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
      clientId: "kitchen-client-" + Math.random().toString(16).slice(2, 10),
      clean: true,
    });

    client.on("connect", () => {
      console.log("✅ 廚師 MQTT 已連線");
      // 可選：在這裡自動訂閱
      client.subscribe("U1113007/kitchen/updated/#", (err) => {
        if (err) {
          console.error("❌ 廚師 MQTT 訂閱失敗：", err);
        } else {
          console.log("📡 廚師已訂閱 kitchen 訂單更新");
        }
      });
    });

    client.on("error", (err) => {
      console.error("❌ 廚師 MQTT 錯誤：", err);
    });
  }

  return client;
}
