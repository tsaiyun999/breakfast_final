"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const role = session?.user?.role;

    switch (role) {
      case "OWNER":
        router.replace("/admin/menu");
        break;
      case "STAFF":
        router.replace("/cashier");
        break;
      case "CHEF":
        router.replace("/kitchen");
        break;
      case "CUSTOMER":
      default:
        router.replace("/menu");
        break;
    }
  }, [status, session, router]);

  return <p>登入中，請稍候...</p>;
}
