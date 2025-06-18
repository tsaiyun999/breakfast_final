import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

// 更新菜單項目
export async function PUT(req, context) {
  const { id } = context.params;

  try {
    if (!id) {
      return new Response("缺少菜單 ID", { status: 400 });
    }

    const body = await req.json();
    const { name, price, description, imageUrl, isAvailable } = body;

    if (!name || price === undefined || price < 0) {
      return new Response("名稱與價格為必填，且價格不可為負數", { status: 400 });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        price,
        imageUrl,
        isAvailable,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ 更新菜單失敗:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// 刪除菜單項目
export async function DELETE(_, context) {
  const { id } = context.params;

  try {
    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ 刪除餐點失敗:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
