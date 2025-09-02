import { NextResponse } from 'next/server';
import { prisma } from "@/shared/lib/prisma";
import dayjs from 'dayjs';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { result, organization_id, transaction_ids, type } = body;

    if (!organization_id || !result) {
      return NextResponse.json({ message: 'organizationId and result are required' }, { status: 400 });
    }

    if (type === 'kaspi') {
      const parsedDate = dayjs(result.pos_response.data.chequeInfo.date);

      const parsedResultDate = parsedDate.isValid()
        ? parsedDate.toISOString()
        : dayjs().toISOString();

      const bankT = await prisma.bankTransaction.create({
        data: {
          amount: result.pos_response.data.chequeInfo.amount,
          date: parsedResultDate,
          meta: result.pos_response.data,
          organizationId: organization_id as string,
          transactionId: result.pos_response.data.transactionId
        }
      })
      if (bankT) {
        for (const tr_id in transaction_ids) {
          await prisma.crmTransaction.update({
            where: {
              id: tr_id
            },
            data: {
              bankTransactionId: bankT.id
            }
          })
        }
      } else {
        throw Error('Произошла ошибка с созданием банковской транзакции')
      }
    } else if (type === 'halyk') {
      const parsedDate = dayjs(result.pos_response.data.dateTime);

      const parsedResultDate = parsedDate.isValid()
        ? parsedDate.toISOString()
        : dayjs().toISOString();

      const bankT = await prisma.bankTransaction.create({
        data: {
          amount: result.pos_response.data.amount,
          date: parsedResultDate,
          meta: result.pos_response.data,
          organizationId: organization_id as string,
          transactionId: crypto.randomUUID()
        }
      })
      if (bankT) {
        for (const tr_id in transaction_ids) {
          await prisma.crmTransaction.update({
            where: {
              id: tr_id
            },
            data: {
              bankTransactionId: bankT.id
            }
          })
        }
      } else {
        throw Error('Произошла ошибка с созданием банковской транзакции')
      }
    }

    return NextResponse.json({ message: 'Command sent to agent successfully', status: 'wait' }, { status: 200 });

  } catch (error) {
    console.error("Error sending command:", error);
    return NextResponse.json({ message: 'Failed to send command' }, { status: 500 });
  }
}