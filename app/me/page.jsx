"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const user = session?.user;

      if (user?.id && user?.role) {
        sessionStorage.setItem("user", JSON.stringify(user));
        console.log("✅ 使用者登入成功：", user);

        // 根據角色導向對應頁面
        switch (user.role) {
          case "OWNER":
            router.push("/admin/menu");
            break;
          case "STAFF":
            router.push("/cashier");
            break;
          case "CHEF":
            router.push("/kitchen");
            break;
          case "CUSTOMER":
            router.push("/menu");
            break;
          default:
            router.push("/"); // 預設頁
        }
      }
    }
  }, [status]);

  if (status === "loading") return <p>登入狀態載入中...</p>;
  if (status === "unauthenticated") return <p>未登入，請先登入。</p>;

  const user = session?.user;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">登入成功</h1>

      {user?.image && (
        <Image
          src={user.image}
          alt="使用者頭像"
          width={80}
          height={80}
          className="rounded-full"
        />
      )}

      <div className="text-center">
        <p><strong>名稱：</strong>{user?.name}</p>
        <p><strong>Email：</strong>{user?.email}</p>
        <p><strong>角色：</strong>{user?.role}</p>
      </div>
    </div>
  );
}
