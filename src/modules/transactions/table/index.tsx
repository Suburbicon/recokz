"use client";

import { useState } from 'react';
import { TrashIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import dayjs from "dayjs";
import { api } from "@/shared/lib/trpc/client";
import { LoaderIcon } from "@/shared/ui/loader";
import { Transaction } from '@/modules/transactions/model/Transaction';
import { api as axiosApi } from '@/shared/client'
import { toast } from 'sonner';
import { useUser } from '@clerk/clerk-react';

export function TransactionsTable() {
  const { user } = useUser();
  const utils = api.useUtils();
  const [isLoading, setLoading] = useState(false);
  const { data: transactions } = api.crmTransaction.getAll.useQuery() as {data: Transaction[]};

  const { mutateAsync: createBankTransaction } = api.bankTransaction.create.useMutation({
    onSuccess: () => {
      toast("Банковская транзакция создалась успешно")
    },
    onError: () => {
      toast("Произошла ошибка с созданием банковской транзакции")
    }
  })

  const { mutateAsync: updateCrmTransaction } = api.crmTransaction.update.useMutation({
    onSuccess: () => {
      toast("CRM транзакция обновилась успешно")
    }
  })

  const { mutateAsync: deleteCrmTransaction } = api.crmTransaction.delete.useMutation({
    onSuccess: () => {
      toast("CRM транзакция удалена");
      utils.crmTransaction.getAll.invalidate();
    }
  })

  if (!transactions || isLoading || !user) {
    return (
      <div className="p-6">
        <LoaderIcon className="animate-spin" />
      </div>
    );
  }

  const formatBalance = (balanceInKopecks: number) => {
    return (balanceInKopecks).toLocaleString("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 2,
    });
  };

  const deleteHandler = async (transaction: Transaction) => {
    await deleteCrmTransaction({ id: transaction.id })
  }

  const sendPaymentHalyk = async (transaction: Transaction) => {
    setLoading(true);
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          targetUrl: `https://${localStorage.getItem('posIpAddressHalyk')}`,
          targetMethod: 'POST',
          targetBody: {
            task: 'purchase',
            data: {
              amount: transaction.amount
            }
          }
        })
      })

      const response_data = await response.json();

      const bankT = await createBankTransaction({
        amount: transaction.amount,
        date: response_data.data.dateTime,
        meta: response_data.data,
        organizationId: user.publicMetadata.organizationId as string,
        transactionId: response_data.data.terminalId
      })
      if (bankT) {
        await updateCrmTransaction({
          transactionId: transaction.id,
          bankTransactionId: bankT.id
        })
      } else {
        throw Error('Произошла ошибка с созданием банковской транзакции')
      }
    } catch (error) {
      console.log(error)
      toast.error("Произошла ошибка при отправке платежа");
    } finally {
      setLoading(false);
    }
  }

  const sendPaymentKaspi = async (transaction: Transaction) => {
    setLoading(true);
    try {
      await axiosApi.post(
        '/api/create-payment',
        {
          amount: transaction.amount,
          organizationId: transaction.organizationId,
          transactionId: transaction.id
        }
      )

      toast.success(`Транзакция (${transaction.amount}) отправилась на POS-терминал`);
    } catch (error) {
      console.log(error)
      toast.error("Произошла ошибка при отправке платежа");
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-8 mb-12">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className='text-3xl'>Транзакции</h1>
        </div>
      </div>

      {transactions.length === 0 && (
        <div>
          У вас нет активных транзакций
        </div>
      )}

      {transactions && transactions.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead className="w-[80px]">Оплатить</TableHead>
              <TableHead className="w-[50px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((item) => (
              <TableRow key={item.id} className={
                item.bankTransactionId 
                ? 'bg-[#1b6b23a0] text-white hover:bg-[#1b6b23a0]'
                : ''
              }>
                <TableCell>
                  {item.bankTransactionId ? 'Оплачено' : 'Не оплачено'}
                </TableCell>
                <TableCell>
                  {dayjs(item.createdAt).format("DD.MM.YYYY, HH:mm")}
                </TableCell>
                <TableCell>{formatBalance(Number(item.amount))}</TableCell>
                <TableCell>
                  { 
                    item.meta?.data?.expense.title || "Неизвестно"
                  }
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button 
                      className="flex w-full px-1 bg-red-600 text-white" 
                      variant="default" 
                      size="icon" 
                      asChild
                      onClick={() => sendPaymentKaspi(item)}
                    >
                      <div>Kaspi</div>
                    </Button>
                    <Button 
                      className="flex w-full px-1 bg-green-600 text-white" 
                      variant="default" 
                      size="icon" 
                      asChild
                      onClick={() => sendPaymentHalyk(item)}
                    >
                      <div>Halyk</div>
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {!item.bankTransactionId && (
                    <button type='button' className='cursor-pointer' onClick={() => deleteHandler(item)}>
                      <TrashIcon/>
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
