"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getKitchenMqttClient } from "../../lib/kitchenMqttClient";

const statusMap = {
  PENDING: { text: "等待中", color: "bg-red-100 text-red-700" },
  PREPARING: { text: "製作完成", color: "bg-green-100 text-green-700" },
  READY: { text: "完成", color: "bg-green-100 text-green-700" },
  COMPLETED: { text: "已完成", color: "bg-gray-100 text-gray-700" },
  CANCELLED: { text: "已取消", color: "bg-gray-300 text-gray-600" },
};

export default function OrdersList() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // MQTT 訂閱即時更新
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const client = getKitchenMqttClient();

    const onConnect = () => {
      client.subscribe("U1113007/orders/new/#", (err) => {
  if (err) console.error("❌ 訂閱新訂單失敗", err);
  else console.log("✅ 已訂閱新訂單");
});
client.subscribe("U1113007/kitchen/updated/#", (err) => {
  if (err) console.error("❌ 訂閱訂單更新失敗", err);
  else console.log("✅ 已訂閱訂單更新");
});
    };

    const onMessage = (topic, message) => {
  try {
    const updatedOrder = JSON.parse(message.toString());
     console.log("📨 收到 MQTT 訂單：", updatedOrder);
    console.log("MQTT 新訂單更新", updatedOrder);
    if (!["PENDING", "PREPARING"].includes(updatedOrder.status)) {
      setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
      return;
    }

    setOrders((prev) => {
      const index = prev.findIndex((o) => o.id === updatedOrder.id);
      if (index === -1) {
        return [...prev, updatedOrder];
      } else {
        const newOrders = [...prev];
        newOrders[index] = updatedOrder;
        return newOrders;
      }
    });
  } catch (err) {
    console.error("⚠️ MQTT 訊息解析錯誤", err);
  }
};


    client.on("connect", onConnect);
    client.on("message", onMessage);

    return () => {
      client.off("connect", onConnect);
      client.off("message", onMessage);
    };
  }, [session?.user?.id, status]);

  // 抓取訂單列表
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchOrders = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`/api/kitchen/orders?status=PENDING,PREPARING`);
    if (!res.ok) throw new Error("API 回應失敗");

    const data = await res.json();
    const orders = data.orders || [];
    
    console.log("API 抓到訂單:", orders);
    setOrders(orders);
  } catch (err) {
    console.error("❌ 訂單載入失敗", err);
    setError("載入訂單失敗，請稍後再試");
  } finally {
    setLoading(false);
  }
};


    fetchOrders();
  }, [session?.user?.id, status]);

  const handleStartPreparing = async (orderId) => {
  try {
    const res = await fetch("/api/kitchen/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: "PREPARING" }),
    });

    if (!res.ok) throw new Error("更新失敗");

    console.log("✅ 已標記為製作中"); // 除錯用
  } catch (err) {
    console.error("❌ 更新訂單失敗", err);
    alert("更新訂單失敗，請稍後重試");
  }
};


  if (status === "loading") return <div>載入中...</div>;
  if (status === "unauthenticated") return <div>請先登入</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 dark:text-gray-200">
        👨‍🍳 廚房訂單看板
      </h1>

      {loading && <div className="text-center text-gray-500 mt-12 text-lg">載入中...</div>}
      {error && <div className="text-center text-red-500 mt-12 text-lg">{error}</div>}
      {!loading && !error && (!orders || orders.length === 0) && (
        <div className="text-center text-gray-500 mt-12 text-lg">暫無待處理訂單 🍳</div>
      )}
      {!loading && !error && orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const statusInfo = statusMap[order.status] || { text: order.status, color: "bg-gray-100 text-gray-700" };
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      訂單 #{order.id?.slice(0, 8) || "未知"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "未知時間"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${statusInfo.color} select-none`}
                  >
                    {statusInfo.text}
                  </span>
                </div>

                <div className="mb-3 text-right text-sm text-gray-600 dark:text-gray-300">
                  💰 NT$ {order.totalAmount ? order.totalAmount.toFixed(2) : "0.00"}
                </div>
                {order.customer && (
                <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                <p>顧客名稱：<span className="font-medium">{order.customer.name || "未提供"}</span></p>
                </div>
                )}  
                <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">餐點明細</h3>
                  {order.items?.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <div className="flex justify-between items-start">
                            <span className="font-medium dark:text-gray-200">
                              {item.menuItem?.name || "未知品項"} × {item.quantity}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              NT$ {((item.menuItem?.price ?? 0) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          {item.specialRequest && (
                            <div className="mt-1 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700">
                              <strong>備註：</strong> {item.specialRequest}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500">無餐點明細</p>
                  )}
                </div>

               
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}