import { prisma } from "@/shared/lib/prisma";
import { NextRequest, NextResponse } from "next/server"
import dayjs from 'dayjs'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const data = await req.json();
  const params = await context.params;
  const { companyId } = params;

  const parsedDate = dayjs(data.data?.date);
  
  const parsedResultDate = parsedDate.isValid()
    ? parsedDate.toISOString()
    : dayjs().toISOString();
  
  try {
    if (data.resource === 'finances_operation' && data.status === 'create') {
      await prisma.crmTransaction.create({
        data: {
          amount: data.data?.amount?.toString() || '-',
          date: parsedResultDate,
          meta: data,
          transactionId: data.data?.document_id?.toString() || '0',
          organizationId: companyId,
          bankTransactionId: null
        },
      });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
