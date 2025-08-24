import { NextResponse } from 'next/server';
import { prisma } from "@/shared/lib/prisma";
import dayjs from 'dayjs';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { result, organization_id, transaction_id } = body;

    if (!organization_id || !result) {
      return NextResponse.json({ message: 'organizationId and result are required' }, { status: 400 });
    }

    const bankT = await prisma.bankTransaction.create({
      data: {
        amount: result.pos_response.data.chequeInfo.amount,
        date: dayjs(result.pos_response.data.chequeInfo.date).toISOString(),
        meta: result.pos_response.data,
        organizationId: organization_id as string,
        transactionId: result.pos_response.data.transactionId
      }
    })
    if (bankT) {
      await prisma.crmTransaction.update({
        where: {
          id: transaction_id
        },
        data: {
          bankTransactionId: bankT.id
        }
      })
    } else {
      throw Error('Произошла ошибка с созданием банковской транзакции')
    }

    return NextResponse.json({ message: 'Command sent to agent successfully', status: 'wait' }, { status: 200 });

  } catch (error) {
    console.error("Error sending command:", error);
    return NextResponse.json({ message: 'Failed to send command' }, { status: 500 });
  }
}