import { prisma } from "@/shared/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();

  // Пример: создать транзакцию
  try {
    await prisma.transaction.create({
      data: {
        amount: 100,
        date: new Date(),
        meta: data,
        documentId: "some-id",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
