"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ReadyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("載入菜單失敗");
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      console.error("❌ 載入菜單失敗：", err);
    }
  };

  const getMenuName = (id) => {
    const item = menuItems.find((m) => m.id === id);
    return item ? item.name : "未知品項";
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        await fetchMenuItems();

        const res = await fetch("/api/orders?status=COMPLETED");
        if (!res.ok) throw new Error("載入完成訂單失敗");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("❌ 載入歷史訂單失敗：", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-red-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🍱 完成的訂單</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-24 bg-white rounded-lg shadow"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-500 mt-20 text-lg">
            🎉 目前沒有完成的訂單
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                className="bg-white rounded-xl shadow-md p-5 hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-bold text-pink-600 mb-1">
                  訂單 #{order.id}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  {formatDate(order.createdAt)}
                </p>

                <p className="text-gray-800 font-medium mb-1">
                  顧客：{order.customer?.name || "未知顧客"}
                </p>
                <p className="text-gray-800 font-medium mb-1">
                  總金額：${order.totalAmount.toFixed(2)}
                </p>

                <p className="font-semibold mt-3 mb-1 text-gray-700">餐點內容：</p>
                <ul className="text-sm text-gray-600 list-disc pl-5 mb-2">
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {getMenuName(item.menuItemId)} × {item.quantity}
                      {item.specialRequest && (
                        <span className="text-xs text-gray-500 ml-2">
                          （{item.specialRequest}）
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-gray-500">
                  預計取餐時間：{order.pickupTime}
                </p>
                <button
                  className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-semibold transition"
                  onClick={() => alert(`確認訂單 ${order.id} 已交付`)}
                >
                  ✅ 已交付
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
