import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "未提供檔案" }, { status: 400 });
    }

    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from("images")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("❌ Supabase 上傳錯誤:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from("images")
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
    });
  } catch (err) {
    console.error("❌ 上傳例外錯誤：", err);
    return NextResponse.json({ success: false, error: "上傳失敗" }, { status: 500 });
  }
}
