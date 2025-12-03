import { prisma } from "@/shared/lib/prisma";
import { NextRequest, NextResponse } from "next/server"
import dayjs from 'dayjs'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ companyId: string, key: string }> }
) {
  const data = await req.json();
  const params = await context.params;
  const { companyId, key } = params;

  try {
    const res = await fetch(`${data.events[0].meta.href}`, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Accept-Encoding': 'gzip'
      }
    })

    const resData = await res.json()

    const parsedDate = dayjs(resData.created);
  
    const parsedResultDate = parsedDate.isValid()
      ? parsedDate.toISOString()
      : dayjs().toISOString();

    await prisma.crmTransaction.create({
      data: {
        amount: (Number(resData.sum) / 100)?.toString() || '-',
        date: parsedResultDate,
        meta: resData,
        transactionId: resData.name,
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
