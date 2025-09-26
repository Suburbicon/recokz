import { generateText } from "ai";
import { openai } from "@/server/ai/client";

// TODO: We can add examples of data so that ai can roughly understand what is needed.

const PROMPT = `
    Given the following column headers from a bank transaction table, identify which column refers to:
    1. Date — it can be "Дата операции", "Дата", "Дата валютирования", "Время".
    2. Time — it can be a separate column or can be written together with date.
    3. Amount — "Сумма операции", "Сумма", "Сумма к зачислению/ списанию (т)", "Итого", "Дебет", "Кредит" or other words with the same meaning, if there are several, prioritize them with the most appropriate one at the beginning.
    4. IsIncome — default is true, if it is called "Дебет" it is false.
    5. transactionId - it can be "№ Документа", "Номер операции".

    If there is only one time column, always set it to date and leave time empty, date should not be empty and time should have a value.
    
    Respond in this JSON format: \{ "date": <column index>, "time": <column index>, "amount": <column index> or <column index[]>, isIncome: boolean or boolean[], transactionId: <column index> }\
    
    Don't write comments.

    Headers:
`;

type Column = {
  date: number;
  time: number;
  amount: number | number[];
  isIncome: boolean | boolean[];
  transactionId: number;
};

export const detectTableColumns = async (row: string[]): Promise<Column> => {
  const { text } = await generateText({
    model: openai("gpt-4.1"),
    messages: [
      { role: "system", content: PROMPT },
      {
        role: "user",
        content: `${JSON.stringify(row)}`,
      },
    ],
  });

  return JSON.parse(text) as Column;
};
