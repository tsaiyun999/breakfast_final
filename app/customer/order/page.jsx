"use client";

import { useEffect, useState } from "react";
import { getMqttClient } from "../../../lib/mqttClient";
import { useRouter } from "next/navigation";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) {
      alert("請先登入");
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser?.id) {
      setError("用戶資料缺少 ID，請重新登入");
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const userIdEncoded = encodeURIComponent(parsedUser.id);
        const url = `/api/orders?userId=${userIdEncoded}`;
        console.log("Fetch URL:", url);
        const res = await fetch(url);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`取得訂單失敗: ${errText}`);
        }
        const data = await res.json();
        console.log("取得訂單資料", data);
        setOrders(data.orders || []);  // 防止 data.orders 為 undefined
      } catch (err) {
        console.error("❌ 無法載入訂單：", err);
        setError(err.message || "無法載入訂單");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const client = getMqttClient();

    client.on("connect", () => {
      console.log("📡 MQTT 已連線");
      client.subscribe(`orders/status/${parsedUser.id}`, (err) => {
        if (err) console.error("❌ 訂閱失敗", err);
      });
    });

    client.on("message", (topic, message) => {
      try {
        const updatedOrder = JSON.parse(message.toString());
        setOrders((prev) =>
          prev.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
      } catch (err) {
        console.error("⚠️ MQTT 訊息解析錯誤", err);
      }
    });

    return () => {
      client.end();
    };
  }, [router]);

  if (loading) return <p className="text-center mt-8">載入中...</p>;

  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  if (!orders.length)
    return <p className="text-center mt-8 text-gray-600">目前沒有任何訂單</p>;

  return (
    <div className="min-h-screen bg-orange-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-orange-800">
          我的訂單紀錄
        </h1>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="font-semibold text-lg">訂單編號：#{order.id}</p>
                  <p className="text-sm text-gray-500">
                    建立時間：{new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-pink-600 font-bold">
                    ${(order.totalAmount ?? 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600">
                    狀態：{order.status || "待處理"}
                  </p>
                </div>
              </div>

              <ul className="text-gray-800 text-sm space-y-2">
                {order.items?.map((item, index) => (
                  <li key={index}>
                    {item.menuItem?.name || "未知品項"} × {item.quantity}
                    {item.specialRequest && (
                      <span className="text-gray-500">
                        （{item.specialRequest}）
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


