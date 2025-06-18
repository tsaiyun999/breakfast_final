import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

// 取得所有菜單
export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("❌ 取得菜單失敗:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// 建立新菜單
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, price, description, imageUrl, isAvailable } = body;

    if (!name || price === undefined || price < 0) {
      return new Response("名稱與價格為必填，且價格不可為負數", { status: 400 });
    }

    const createdItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        isAvailable,
      },
    });

    return NextResponse.json(createdItem);
  } catch (err) {
    console.error("❌ 建立菜單失敗:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
