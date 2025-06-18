"use client";

import { useEffect, useState } from "react";

export default function CustomerProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 從 sessionStorage 拿使用者資料
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center text-gray-500">
        請先登入或載入中...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-md bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">顧客個人檔案</h1>
      <div className="mb-4">
        <label className="block font-semibold text-gray-700 mb-1">姓名</label>
        <div className="p-2 border rounded bg-gray-50">{user.name || "未填寫"}</div>
      </div>
      <div className="mb-4">
        <label className="block font-semibold text-gray-700 mb-1">Email</label>
        <div className="p-2 border rounded bg-gray-50">{user.email || "未填寫"}</div>
      </div>
      <div className="mb-4">
        <label className="block font-semibold text-gray-700 mb-1">目前角色</label>
        <div className="p-2 border rounded bg-gray-50">{user.role || "無角色資訊"}</div>
      </div>
    </div>
  );
}