import { prisma } from "@/shared/lib/prisma";
import { error } from "console";
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
        documentId: "a9a14115-07b3-43b1-81c8-c06af0236014",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
