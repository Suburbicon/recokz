"use client";

import { useState } from 'react'
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
      // const response = await axiosApi.get(
      //   `https://${localStorage.getItem('posIpAddressKaspi')}/v2/payment?amount=${transaction.amount}`
      //   // `http://localhost:3000/v2/payment?amount=${transaction.amount}`
      // );
      await axiosApi.post(
        '/api/create-payment',
        {
          amount: transaction.amount,
          organizationId: transaction.organizationId,
          transactionId: transaction.id
        }
      )

      toast.success(`Транзакция (${transaction.amount}) отправилась на POS-терминал`);

      // while (status === 'wait') {
      //   await new Promise((resolve) => setTimeout(resolve, 1000));
      //   paymentResponse = await axiosApi.post(
      //     '/api/status-payment',
          
      //   )
      //   paymentResponse = await axiosApi.get(
      //   `https://${localStorage.getItem('posIpAddressKaspi')}/v2/status?processId=${response.data.data.processId}`
      //   // `http://localhost:3000/v2/status?processId=${response.data.data.processId}`
      //   );
      //   status = paymentResponse.data.data.status;
      // }

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
              <TableHead>Дата</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead className="w-[100px]">Оплатить</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {dayjs(item.date).format("DD.MM.YYYY")}
                </TableCell>
                <TableCell>{formatBalance(item.amount)}</TableCell>
                <TableCell>
                  { 
                    item.meta?.data?.expense.title || "Неизвестно"
                  }
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button 
                      className="flex w-full px-2 bg-red-600 text-white" 
                      variant="default" 
                      size="icon" 
                      asChild
                      onClick={() => sendPaymentKaspi(item)}
                    >
                      <div>Kaspi</div>
                    </Button>
                    <Button 
                      className="flex w-full px-2 bg-green-600 text-white" 
                      variant="default" 
                      size="icon" 
                      asChild
                      onClick={() => sendPaymentHalyk(item)}
                    >
                      <div>Halyk</div>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
