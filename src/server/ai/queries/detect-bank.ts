import { generateText } from "ai";
import { openai } from "@/server/ai/client";

const bankList = [
  ["Каспи", "Kaspi"],
  ["Халык", "Народный банк", "Halyk"],
  ["Береке"],
  ["Форте"],
  ["Фридом", "Freedom"],
];

const PROMPT = `
    You are an assistant that extracts the name of a bank from rows. Identify the bank it refers to using one of the following options (if possible):
    BankList: ${bankList.join(", ")}
    If you notice in rows a bank name from bank list, then return answer in English
    If the bank cannot be determined, respond with "Неизвестно".
    Answer: Kaspi or Halyk`;

export const detectBank = async (rows: string[][]) => {
  const { text } = await generateText({
    model: openai("gpt-4.1-mini"),
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

  return text;
};
