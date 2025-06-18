import { supabase } from "./supabase";


export async function uploadImageToSupabase(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || !data.success || !data.url) {
    throw new Error(data.error || "圖片上傳失敗");
  }

  return data.url;
}
