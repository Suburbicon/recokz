import { extractDateFromPaymentPurpose } from "@/modules/reports/form/steps/lib/extract-date-from-payment-purpose";

export const mergeKnpTransactions = (data: any[]) => {
  const knp190ByDate = new Map<
    string,
    {
      date: string;
      amount: number;
      meta: Record<string, string | number | boolean>;
      transactionId: string;
    }[]
  >();
  const otherTransactions: typeof data = [];

  data.forEach((transaction) => {
    const knp = transaction.meta["КНП"];
    const isKnp190 =
      knp === "190" || knp === 190 || String(knp) === "190";

    if (isKnp190) {
      const paymentPurpose = transaction.meta["Назначение платежа"];
      const purposeStr =
        typeof paymentPurpose === "string" ? paymentPurpose : undefined;
      const extractedDate = extractDateFromPaymentPurpose(purposeStr);

      if (extractedDate && extractedDate.isValid()) {
        const dateKey = extractedDate.format("DD/MM/YYYY");
        if (!knp190ByDate.has(dateKey)) {
          knp190ByDate.set(dateKey, []);
        }
        knp190ByDate.get(dateKey)!.push(transaction);
      } else {
        otherTransactions.push(transaction);
      }
    } else {
      otherTransactions.push(transaction);
    }
  });

  const mergedKnp190Transactions: typeof data = [];
  knp190ByDate.forEach((transactions, dateKey) => {
    if (transactions.length === 0) return;

    if (transactions.length === 1) {
      mergedKnp190Transactions.push(transactions[0]);
    } else {
      const totalAmount = transactions.reduce(
        (sum, t) => sum + t.amount,
        0,
      );
      const mergedTransactionIds = transactions
        .map((t) => t.transactionId)
        .join(", ");

      const mergedMeta = {
        ...transactions[0].meta,
        amount: totalAmount,
        mergedFrom: transactions.length,
        originalTransactionIds: mergedTransactionIds,
      };

      mergedKnp190Transactions.push({
        date: transactions[0].date,
        amount: totalAmount,
        meta: mergedMeta,
        transactionId: mergedTransactionIds,
      });
    }
  });

  return [...otherTransactions, ...mergedKnp190Transactions];
}