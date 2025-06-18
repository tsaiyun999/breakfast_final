'use client';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function LoginContent() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const searchParams = useSearchParams();
  const oauthError = searchParams?.get("error");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  const { email, password } = formData;

  if (!email || !password) {
    setError("所有欄位皆為必填");
    return;
  }

  setIsSubmitting(true);

  try {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "AccessDenied") {
        setError("❌ 此帳號已被停權");
      } else {
        setError("登入失敗：" + res.error);
      }
      return;
    }

    // 等待 session 更新後導向
    setShowSuccess(true);
    setTimeout(() => {
      window.location.href = "/checkout";
    }, 1500);
  } catch (err) {
    setError("登入過程發生錯誤");
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-300 via-pink-400 to-red-400 px-4">
      <div className="max-w-md w-full bg-white/30 backdrop-blur-lg border border-white/30 shadow-2xl rounded-2xl p-8 transition-all">
        <h2 className="text-3xl font-extrabold text-center text-gray-700 drop-shadow mb-6">
          登入帳號
        </h2>

        {error && (
          <div className="mb-4 text-red-600 text-sm text-center font-medium bg-red-100 p-2 rounded-md shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {oauthError === "AccessDenied" && (
          <div className="mb-4 text-red-600 text-sm text-center font-medium bg-red-100 p-2 rounded-md shadow-sm">
            ❌ 此帳號已被停權，無法登入
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn("google")}
            className="w-full bg-white text-gray-800 border border-gray-300 py-2 px-4 rounded-md flex items-center justify-center gap-2 shadow hover:bg-gray-50 transition"
          >
            <Image src="/google.png" alt="Google" width={24} height={24} />
            使用 Google 登入
          </button>

          <button
            type="button"
            onClick={() => signIn("github")}
            className="w-full bg-white text-gray-800 border border-gray-300 py-2 px-4 rounded-md flex items-center justify-center gap-2 shadow hover:bg-gray-50 transition"
          >
            <Image src="/github.png" alt="GitHub" width={24} height={24} />
            使用 GitHub 登入
          </button>
        </div>
      </div>
    </div>
  );
}
