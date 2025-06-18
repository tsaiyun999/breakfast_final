"use client";

import { useEffect, useState } from "react";
import mqtt from "mqtt";

let client;
let debounceTimeout;

const debounceFetchData = (callback, delay = 300) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    callback();
  }, delay);
};

export default function CashierPage() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderIds, setProcessingOrderIds] = useState(new Set());
  const [isProcessingAnyOrder, setIsProcessingAnyOrder] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersRes = await fetch("/api/orders");
        const menuRes = await fetch("/api/menu");

        if (!ordersRes.ok || !menuRes.ok)
          throw new Error("載入 API 失敗");

        const ordersData = await ordersRes.json();
        const menuData = await menuRes.json();

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setMenuItems(Array.isArray(menuData) ? menuData : []);
      } catch (err) {
        console.error("❌ 載入資料失敗:", err);
        setOrders([]);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    // 初次載入
    fetchData();

    // MQTT 建立與訂閱
    client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");

    client.on("connect", () => {
      client.subscribe("U1113007/orders/new/#");
      client.subscribe("U1113007/orders/updated/#");
    });

    client.on("message", (topic, message) => {
      const parsed = JSON.parse(message.toString());
      console.log("📨 MQTT 訊息：", parsed);
      debounceFetchData(fetchData); // 使用防抖機制
    });

    return () => {
      client?.end();
    };
  }, []);


  const getMenuName = (id) => {
    return menuItems.find((item) => item.id === id)?.name || "未知品項";
  };

  const togglePaymentStatus = async (orderId, currentStatus) => {
    if (processingOrderIds.has(orderId) || isProcessingAnyOrder) return;
    setProcessingOrderIds((prev) => new Set(prev).add(orderId));
    setIsProcessingAnyOrder(true);

    if (typeof currentStatus !== "boolean") {
  console.error("❌ 異常的 paymentStatus 值：", currentStatus);
  setProcessingOrderIds((prev) => {
    const updated = new Set(prev);
    updated.delete(orderId);
    return updated;
  });
  setIsProcessingAnyOrder(false);
  return;
}


    

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: !currentStatus }),
      });

      if (!res.ok) throw new Error(`togglePaymentStatus 失敗，狀態碼：${res.status}`);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, paymentStatus: !currentStatus } : order
        )
      );

      client?.publish(
        `U1113007/orders/updated/${orderId}`,
        JSON.stringify({ orderId, action: "PAYMENT_UPDATED" })
      );
    } catch (err) {
      console.error("付款狀態切換失敗：", err);
    }finally {
    setProcessingOrderIds((prev) => {
      const updated = new Set(prev);
      updated.delete(orderId);
      return updated;
    });
     setIsProcessingAnyOrder(false);
  }
};
  

  const toggleOrderStatus = async (orderId, currentStatus) => {
    if (processingOrderIds.has(orderId) || isProcessingAnyOrder) return;

    const newStatus = currentStatus === "PREPARING" ? "PENDING" : "PREPARING";


      // 保護：確保狀態合法
      const allowed = ["PENDING", "PREPARING"];
      if (!allowed.includes(currentStatus)) {
      console.warn("⚠️ 無效狀態傳入 toggleOrderStatus：", currentStatus);
      return;
      }
      setProcessingOrderIds((prev) => new Set(prev).add(orderId));

    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!res.ok) throw new Error(`toggleOrderStatus 失敗，狀態碼：${res.status}`);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      client?.publish(
        `U1113007/orders/updated/${orderId}`,
        JSON.stringify({ orderId, action: "STATUS_UPDATED", newStatus })
      );
    } catch (err) {
      console.error("狀態切換失敗：", err);
    }finally {
    setProcessingOrderIds((prev) => {
      const updated = new Set(prev);
      updated.delete(orderId);
      return updated;
    });
     setIsProcessingAnyOrder(false);
  }
};

  const completeOrder = async (orderId) => {
  if (isProcessingAnyOrder) return;
  setIsProcessingAnyOrder(true);

  try {
    const res = await fetch("/api/orders/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: "COMPLETED" }),
    });

    if (!res.ok) throw new Error(`completeOrder 失敗，狀態碼：${res.status}`);

    setOrders((prev) => prev.filter((order) => order.id !== orderId));

    client?.publish(
      `U1113007/orders/updated/${orderId}`,
      JSON.stringify({ orderId, action: "COMPLETED" })
    );
  } catch (err) {
    console.error("完成訂單失敗：", err);
  } finally {
    setIsProcessingAnyOrder(false);
  }
};


  const pendingOrders = Array.isArray(orders)
    ? orders.filter((order) => order.status !== "COMPLETED")
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center sm:text-left text-gray-800">
          店員付款管理 / 處理中訂單
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">載入中...</p>
        ) : pendingOrders.length === 0 ? (
          <p className="text-gray-500 text-center sm:text-left">
            目前沒有處理中的訂單。
          </p>
        ) : (
          <div className="space-y-6">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      訂單 #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-medium ${
                      order.paymentStatus
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.paymentStatus ? "已付款" : "未付款"}
                  </span>
                </div>

                <div className="mb-3 space-y-1 text-gray-700">
                  <p>
                    <strong>總金額：</strong>${order.totalAmount?.toFixed(2)}
                  </p>
                  <p>
                    <strong>顧客：</strong>
                    {order.customer?.name || "未知"}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2 text-gray-700">
                    餐點內容：
                  </h4>
                  <ul className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>
                          {item.menuItem?.name || "未知品項"} × {item.quantity}
                          {item.specialRequest && (
                            <span className="block text-xs text-gray-400">
                              備註：{item.specialRequest}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                <button
                onClick={() => togglePaymentStatus(order.id, order.paymentStatus)}
                disabled={processingOrderIds.has(order.id) || isProcessingAnyOrder}
                className={`${
                order.paymentStatus
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
                } text-white px-4 py-2 rounded-md transition ${
                (processingOrderIds.has(order.id) || isProcessingAnyOrder)
                ? "opacity-50 cursor-not-allowed"
                : ""
                }`}
                >
                {order.paymentStatus ? "已付款" : "目前未付款"}
                </button>

                  <button
                  onClick={() => toggleOrderStatus(order.id, order.status)}
                  disabled={processingOrderIds.has(order.id) || isProcessingAnyOrder}
                  className={`${
                  order.status === "PREPARING"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
                  } text-white px-4 py-2 rounded-md transition ${
                  (processingOrderIds.has(order.id) || isProcessingAnyOrder)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
                  }`}
                  >
                  {order.status === "PREPARING" ? "已製作完成" : "標記為製作完成"}
                  </button>

                  <button
                    onClick={() => {
                      if (!order.paymentStatus) {
                        alert("⚠️ 請先確認付款！");
                        return;
                      }
                      if (order.status !== "PREPARING") {
                        alert("⚠️ 請先將訂單標記為『已製作完成』！");
                        return;
                      }
                      completeOrder(order.id);
                    }}
                    className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md transition"
                  >
                    完成訂單
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
