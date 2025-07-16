import { prisma } from "@/shared/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();

  // Пример: создать транзакцию
  await prisma.transaction.create({
    data: {
      amount: 100,
      date: new Date(),
      meta: data,
      documentId: "some-id",
    },
  });

  return NextResponse.json({ success: true });
}
