import { generateText} from 'ai';
import { openai } from "@/server/ai/client";
import { Transaction } from "@prisma/client";

const PROMPT = `
    Role
    You are an experienced financial analyst and data reconciliation specialist. Your task is to meticulously find matches and identify discrepancies.

    Goal
    Reconcile two lists of transactions: one from a bank statement and one from a CRM system. You must identify matching transactions, and transactions that only exist in one of the lists.

    Reconciliation Logic (Rules)
    Matching Criteria: Two transactions are considered a match if their amount is identical AND the absolute time difference between their date timestamps is less than 24 hours. For example, a transaction at 2025-07-01T10:34:44Z and another at 2025-07-01T17:00:00Z are a match if their amounts are the same.

    Uniqueness: Each transaction from one list can be matched with only one transaction from the other (1-to-1 matching).

    Tasks (What to do)
    Analyze the two provided JSON arrays: bank_transactions and crm_transactions.

    First, identify and separate all CRM transactions that are marked as "Cash". A transaction is considered cash if its meta field contains the keyword "Наличные". These should be moved to their own category and excluded from the main reconciliation process.

    From the remaining non-cash transactions, find all matching pairs based on the Matching Criteria.

    Identify all bank transactions that have no corresponding match in the CRM.

    Identify all non-cash CRM transactions that have no corresponding match in the bank statement.

    Calculate the total sum of the amount field for each of the four final categories.

    Write reason white transaction not reconcile.

    Format the final output as a single JSON object according to the schema specified below.

    Output Format
    You must return the response only in JSON format, with no explanations or conversational text before or after the JSON object.
    Example output: {
        "reconciled": [
            {
                "bank_transaction": {
                    ...{bank_transaction} (элемент из массива который я тебе передал),
                    "id": "tr_123",
                    "date": "2025-07-10",
                    "amount": 15000,
                    "description": "Оплата по счету INV-001 от ТОО Рога и Копыта",
                    "byCash": false
                },
                "crm_transaction": {
                    ...{crm_transaction} (элемент из массива который я тебе передал),
                    "invoice_id": "INV-001",
                    "date": "2025-07-10",
                    "amount": 15000,
                    "customer_name": "ТОО Рога и Копыта",
                    "byCash": false
                }
            }
        ],
        "transaction_by_cash": [
            {
                ...{crm_transaction} (элемент из массива который я тебе передал),
                "invoice_id": "INV-001",
                "date": "2025-07-10",
                "amount": 15000,
                "customer_name": "ТОО Рога и Копыта",
                "byCash": true
            }
        ]
        "unreconciled_bank": [
            {
                ...{bank_transaction} (элемент из массива который я тебе передал),
                "id": "tr_124",
                "date": "2025-07-11",
                "amount": 5000,
                "description": "Перевод от частного лица",
                "byCash": false,
                "reason": "Не сошлась дата"
            }
        ],
        "unreconciled_crm": [
            {
                ...{crm_transaction} (элемент из массива который я тебе передал),
                "invoice_id": "INV-002",
                "date": "2025-07-12",
                "amount": 75000,
                "customer_name": "ТОО Солнышко",
                "byCash": false,
                "reason": "Не сошлась дата"
            }
        ],
        pricing: {
            reconciled: 15000,
            transaction_by_cash: 15000,
            unreconciled_bank: 15000,
            unreconciled_crm: 15000
        }
    }
`;

export const reconcileDocs = async (bankTransactions: Transaction[], crmTransactions: Transaction[]) => {
    const { text } = await generateText({
        model: openai("gpt-4.1"),
        messages: [
        { role: "system", content: PROMPT },
        {
            role: "user",
            content: `
                bank_transactions: ${JSON.stringify(bankTransactions)}\n
                crm_transactions: ${JSON.stringify(crmTransactions)}
            `,
        },
        ],
    });

    console.log(text);
}
