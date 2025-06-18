//顧客 訂單確認頁

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import { createOrder } from "@/app/orders/actions";

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [specialRequests, setSpecialRequests] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState({});
    useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
    const parsed = JSON.parse(storedUser);
    console.log("✅ 抓到的使用者資料：", parsed);
    setUser(parsed); 
    }
    }, []);

    useEffect(() => {
        const savedCart = sessionStorage.getItem("cart");
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        } else {
            window.location.href = "/";
        }

        const getMenuItems = async () => {
            try {
                const response = await fetch("/api/menu");
                const data = await response.json();
                setMenuItems(data);
            } catch (err) {
                console.error(err);
            }
        };
        getMenuItems();
    }, []);

    const getTotalPrice = () => {
        return cart.reduce((total, cartItem) => {
            const menuItem = menuItems.find((item) => item.id === cartItem.id);
            return total + (menuItem?.price || 0) * cartItem.quantity;
        }, 0);
    };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const orderItems = cart.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
      specialRequest: specialRequests[item.id] || "",
    }));

    const orderData = {
      userId: user.id, 
      totalAmount: getTotalPrice(),
      orderItems,
    };

    console.log("🚀 送出訂單資料：", orderData);

    const res = await fetch(`/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      throw new Error("訂單送出失敗");
    }

    const result = await res.json();
    console.log("✅ 訂單建立成功", result);

    // 導向訂單列表頁
    router.push("/orders");
  } catch (err) {
    console.error("❌ 送出訂單錯誤", err);
    alert("訂單送出失敗，請稍後再試");
  } finally {
    setIsSubmitting(false);
  }
};



    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                確認訂單
            </h1>

            {cart.length === 0 ? (
                <div className="text-center text-gray-500 text-lg mt-20">
                    購物車目前是空的，請先選擇餐點。
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-6"
                >
                    <h2 className="text-xl font-semibold text-gray-700">
                        訂單明細
                    </h2>

                    <ul className="divide-y">
                        {cart.map((cartItem) => {
                            const menuItem = menuItems.find(
                                (item) => item.id === cartItem.id
                            );
                            if (!menuItem) return null;

                            return (
                                <li
                                    key={cartItem.id}
                                    className="py-4 space-y-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 font-medium">
                                            {menuItem.name} ×{" "}
                                            {cartItem.quantity}
                                        </span>
                                        <span className="text-right font-semibold text-gray-700">
                                            $
                                            {(
                                                menuItem.price *
                                                cartItem.quantity
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div>
                                        <label
                                            htmlFor={`special-request-${cartItem.id}`}
                                            className="block text-sm text-gray-500 mb-1"
                                        >
                                            備註（可選）
                                        </label>
                                        <textarea
                                            id={`special-request-${cartItem.id}`}
                                            className="w-full border rounded-md p-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-300 resize-none"
                                            rows={2}
                                            placeholder="例如：去冰、少糖..."
                                            value={
                                                specialRequests[cartItem.id] ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                setSpecialRequests((prev) => ({
                                                    ...prev,
                                                    [cartItem.id]:
                                                        e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="border-t pt-4 text-lg font-bold flex justify-between">
                        <span>總金額：</span>
                        <span>${getTotalPrice().toFixed(2)}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || cart.length === 0}
                        className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-md shadow hover:opacity-90 disabled:bg-gray-400 transition duration-300"
                    >
                        {isSubmitting ? "正在送出訂單..." : "送出訂單"}
                    </button>
                </form>
            )}
        </div>
    );
}
