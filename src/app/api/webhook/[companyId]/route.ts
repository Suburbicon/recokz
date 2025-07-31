import { prisma } from "@/shared/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const data = await req.json();
  const params = await context.params;
  const { companyId } = params;
  
  try {
    await prisma.crmTransaction.create({
      data: {
        amount: data.data.amount,
        date: new Date(data.data.date),
        meta: data,
        transactionId: data.data.document_id.toString() || '0',
        organizationId: companyId,
        bankTransactionId: null
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
