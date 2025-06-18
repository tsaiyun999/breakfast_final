import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";


export async function PATCH(request, { params }) {
  const { id } = params;
  const body = await request.json();

  try {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: body.paymentStatus ?? undefined,
        // 如果未來還要支援其他欄位更新也能擴充這裡
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("更新訂單錯誤:", err);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}
