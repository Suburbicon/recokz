import { generateText } from "ai";
import { openai } from "@/server/ai/client";

const PROMPT = `
  Given the following rows from a bank XLSX file, determine the most probable row number where the actual data table starts.
  There will be a lot of row, so you should find the most probable row number where the actual data table starts.
  There will be words like "Сумма", "Дата", "Время", "Сумма операции", "Сумма к зачислению/ списанию (т)", "Итого", "Дебет", "Кредит" or other words with the same meaning.
  Ignore metadata above. Answer with the row number only.
  Rows:
`;

export const detectTableStartRow = async (rows: string[][]) => {
  const { text } = await generateText({
    model: openai("gpt-4.1"),
    messages: [
      { role: "system", content: PROMPT },
      {
        role: "user",
        content: rows
          .map((r, i) => `${i + 1}: ${Object.values(r).join(" | ")}`)
          .join("\n"),
      },
    ],
  });

  const startRow = parseInt(text?.trim() || "0", 10);

  return startRow - 1;
};
