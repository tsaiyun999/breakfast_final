"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import mqtt from "mqtt"; 

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let client;

    const getOrders = async () => {
      try {
        const sessionUser = sessionStorage.getItem("user");
        if (!sessionUser) {
          alert("請先登入");
          return;
        }
        const user = JSON.parse(sessionUser);
        if (!user.id) {
          alert("用戶 ID 不存在，請重新登入");
          return;
        }

        const response = await fetch(`/api/orders?userId=${encodeURIComponent(user.id)}&status=ALL`);
        if (!response.ok) throw new Error("伺服器錯誤");

        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          console.warn("格式錯誤", data);
          setOrders([]);
        }

        //  MQTT 連線與訂閱
        client = mqtt.connect("wss://broker.emqx.io:8084/mqtt"); 
        client.on("connect", () => {
          console.log("📡 MQTT 已連線（顧客）");
          client.subscribe(`U1113007/orders/updated/+`);
        });

        client.on("message", (topic, message) => {
          try {
            const payload = JSON.parse(message.toString());
            console.log("📬 收到訂單更新：", payload);
            if (payload.orderId) {
              getOrders(); // 🔁 重新抓資料
            }
          } catch (err) {
            console.error("❌ MQTT 訊息解析錯誤", err);
          }
        });
      } catch (err) {
        console.error("❌ 讀取訂單失敗：", err);
        setOrders([]);
      }
    };

    getOrders();

    return () => {
      if (client) client.end();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PREPARING":
        return "bg-blue-100 text-blue-800";
      case "READY":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
const getDisplayStatus = (status) => {
  switch (status) {
    case "PENDING":
      return "製作中";
    case "PREPARING":
      return "餐點製作完成";
    case "READY":
      return "可取餐";
    case "COMPLETED":
      return "取餐完成";
    case "CANCELLED":
      return "已取消";
    default:
      return status;
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center sm:text-left text-gray-800">我的訂單</h1>

        {orders.length === 0 ? (
          <p className="text-gray-500 text-center sm:text-left">您目前沒有任何訂單。</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">訂單 #{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`mt-2 sm:mt-0 px-3 py-2 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getDisplayStatus(order.status)}
                  </span>
                </div>

                <div className="mb-3 space-y-1">
                  <p className="text-gray-700">
                    <strong>總金額：</strong> ${order.totalAmount.toFixed(2)}
                  </p>
                  <p className={order.paymentStatus ? "text-green-600" : "text-red-600"}>
                    <strong>付款狀態：</strong> {order.paymentStatus ? "已付款" : "未付款"}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2 text-gray-700">餐點內容：</h4>
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span>
                          {item.menuItem?.name || "未知品項"} × {item.quantity}
                          {item.specialRequest && (
                            <span className="block text-xs text-gray-400">備註：{item.specialRequest}</span>
                          )}
                        </span>
                        <span>
                          ${(item.menuItem?.price ?? 0 * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {order.status === "READY" && !order.completedAt && (
                  <div className="mt-4 text-center sm:text-right">
                    <Link
                      href={`/orders/${order.id}/complete`}
                      className="inline-block bg-gradient-to-r from-green-500 to-green-700 text-white px-5 py-2 rounded-md hover:opacity-90 transition"
                    >
                      確認取餐
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
