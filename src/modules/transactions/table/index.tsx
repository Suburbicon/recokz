"use client";

import { useState, ChangeEvent } from 'react';
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
import { CustomCheckbox } from "@/shared/ui/checkbox";

export function TransactionsTable() {
  const { user } = useUser();
  const utils = api.useUtils();
  const [isLoading, setLoading] = useState(false);
  const [checkedTransactions, setCheckedTransactions] = useState<string[]>([]);
  const [amountOfTransactions, setAmountOfTransaction] = useState(0);
  const { data: transactions } = api.crmTransaction.getAll.useQuery() as {data: Transaction[]};

  const { mutateAsync: deleteCrmTransaction } = api.crmTransaction.delete.useMutation({
    onSuccess: () => {
      toast("CRM транзакция удалена");
      utils.crmTransaction.getAll.invalidate();
    },
    onError: () => {
      toast("Не получилось удалить транзакцию");
    }
  })

  const { mutateAsync: updateCrmTransaction } = api.crmTransaction.update.useMutation({
    onSuccess: () => {
      toast("CRM транзакция оплачена");
      utils.crmTransaction.getAll.invalidate();
    },
    onError: () => {
      toast("Не получилось оплатить транзакцию в ручную");
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
      await axiosApi.post(
        '/api/create-payment',
        {
          amount: transaction.amount,
          organizationId: user.publicMetadata.organizationId,
          transactionIds: [transaction.id],
          type: 'halyk'
        }
      )

      toast.success(`Транзакция (${transaction.amount}) отправилась на Halyk-терминал`);
    } catch (error) {
      console.log(error)
      toast.error("Произошла ошибка при отправке платежа");
    }

    setLoading(false);
  }

  const sendPaymentKaspi = async (transaction: Transaction) => {
    setLoading(true);
    try {
      await axiosApi.post(
        '/api/create-payment',
        {
          amount: transaction.amount,
          organizationId: user.publicMetadata.organizationId,
          transactionIds: [transaction.id],
          type: 'kaspi'
        }
      )

      toast.success(`Транзакция (${transaction.amount}) отправилась на Kaspi-терминал`);
    } catch (error) {
      console.log(error)
      toast.error("Произошла ошибка при отправке платежа");
    }

    setLoading(false);
  }

  const handleOptionChange = (event: ChangeEvent<HTMLInputElement>, amount: string) => {
    const { name: id } = event.target;
    if (checkedTransactions.includes(id)) {
      setCheckedTransactions(prev => prev.filter(tId => tId !== id))
      setAmountOfTransaction(prev => prev - Number(amount))
      return
    }

    setCheckedTransactions(prev => [...prev, id])
    setAmountOfTransaction(prev => prev + Number(amount))
  }

  const handleCommonPayment = async (type: 'halyk' | 'kaspi') => {
    setLoading(true);
    try {
      await axiosApi.post(
        '/api/create-payment',
        {
          amount: amountOfTransactions.toString(),
          organizationId: user.publicMetadata.organizationId,
          transactionIds: checkedTransactions,
          type: type
        }
      )

      toast.success(`Транзакции на сумму (${amountOfTransactions}) отправились на ${type}-терминал`);
    } catch (error) {
      console.log(error)
      toast.error("Произошла ошибка при отправке платежа");
    }

    setLoading(false);
  }

  const makeTransactionPayed = async (transaction: Transaction) => {
    setLoading(true);
    try {
      await updateCrmTransaction({
        transactionId: transaction.id,
        bankTransactionId: `by-hand-${crypto.randomUUID()}`
      })
    } catch (e) {
      console.log(e)
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-8 mb-12">
      <div className="flex justify-between flex gap-4">
        <div>
          <h1 className='text-3xl'>Транзакции</h1>
        </div>
        {checkedTransactions.length !== 0 && (
          <div>
            Сумма: {amountOfTransactions}
            <div className="flex justify-end gap-2">
              <Button 
                className="flex w-full px-1 bg-red-600 text-white" 
                variant="default" 
                size="icon" 
                asChild
                onClick={() => handleCommonPayment('kaspi')}
              >
                <div>Kaspi</div>
              </Button>
              <Button 
                className="flex w-full px-1 bg-green-600 text-white" 
                variant="default" 
                size="icon" 
                asChild
                onClick={() => handleCommonPayment('halyk')}
              >
                <div>Halyk</div>
              </Button>
            </div>
          </div>
        )}
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
                  <CustomCheckbox
                    id={item.id}
                    name={item.id}
                    label=""
                    checked={checkedTransactions.includes(item.id)}
                    onChange={e => handleOptionChange(e, item.amount)}
                  />
                  {item.bankTransactionId ? 'Оплачено' : 'Не оплачено'}
                </TableCell>
                <TableCell>
                  {dayjs(item.createdAt).format("DD.MM.YYYY, HH:mm")}
                </TableCell>
                <TableCell>{formatBalance(Number(item.amount))}</TableCell>
                <TableCell>
                  { 
                    `${item.meta?.data?.expense?.title} (${item.meta?.data?.account?.title})`
                  }
                </TableCell>
                <TableCell>
                  {!checkedTransactions.includes(item.id) && (
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
                  )}
                </TableCell>
                <TableCell>
                  {!item.bankTransactionId && (
                    <div className="flex">
                      <button type='button' className='cursor-pointer' onClick={() => deleteHandler(item)}>
                        <TrashIcon/>
                      </button>
                    </div>
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
