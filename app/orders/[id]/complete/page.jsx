"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CompleteOrderPage() {
    const router = useRouter();
    const { id } = useParams();

    const [status, setStatus] = useState("loading"); // loading | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const completeOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${id}/complete`, {
                    method: "POST",
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "無法完成訂單");

                setStatus("success");
                setMessage("🎉 取餐確認成功，感謝您的訂購！");
            } catch (err) {
                setStatus("error");
                setMessage(err.message || "發生錯誤，請稍後再試");
            }
        };

        if (id) completeOrder();
    }, [id]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-blue-100 to-purple-200 px-4">
            <div className="max-w-md w-full bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/30 text-center">
                {status === "loading" ? (
                    <div className="text-xl text-gray-600 animate-pulse">正在處理您的取餐請求...</div>
                ) : (
                    <>
                        <div
                            className={`text-4xl mb-4 ${
                                status === "success" ? "text-green-600" : "text-red-600"
                            }`}
                        >
                            {status === "success" ? "✅" : "❌"}
                        </div>
                        <h1
                            className={`text-xl font-bold mb-2 ${
                                status === "success" ? "text-green-800" : "text-red-800"
                            }`}
                        >
                            {status === "success" ? "取餐成功" : "取餐失敗"}
                        </h1>
                        <p className="text-gray-700 mb-6">{message}</p>
                        <button
                            onClick={() => router.push("/orders")}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition drop-shadow-md"
                        >
                            返回訂單列表
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
