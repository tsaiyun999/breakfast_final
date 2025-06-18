"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const userIdEncoded = encodeURIComponent(parsedUser.id);
        const url = `/api/orders?userId=${userIdEncoded}`;
        console.log("Fetch URL:", url);
        const res = await fetch(url);

        if (!res.ok) throw new Error("讀取訂單失敗");
        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        console.error(err);
        setError(err.message || "發生錯誤");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        訂單資料載入中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6 text-center">
        找不到訂單資料。
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-lg bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">訂單詳細資料</h1>
      <div className="mb-4">
        <strong>訂單編號：</strong> {order.id}
      </div>
      <div className="mb-4">
        <strong>顧客名稱：</strong> {order.customer?.name || "未知"}
      </div>
      <div className="mb-4">
        <strong>取餐時間：</strong>{" "}
        {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : "未知"}
      </div>
      <div className="mb-4">
        <strong>訂單品項：</strong>
        <ul className="list-disc list-inside mt-2">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <li key={index}>
                {item.menuItem?.name || "未知品項"} × {item.quantity}
                {item.specialRequest && `（${item.specialRequest}）`}
              </li>
            ))
          ) : (
            <li>無品項資料</li>
          )}
        </ul>
      </div>
    </div>
  );
}
