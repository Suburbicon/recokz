import { generateText } from "ai";
import { openai } from "@/server/ai/client";

const bankList = [
  "Каспи",
  "Халык",
  "Береке",
  "Форте",
  "Евразийский",
  "Фридом",
  "Отбасы",
  "ЦентрКредит",
  "Хоум",
];

const PROMPT = `
    You are an assistant that extracts the name of a bank from a file name. Below is the file name. Identify the bank it refers to using one of the following options (if possible):
    ${bankList.join(", ")}
    If the bank cannot be determined, respond with "Неизвестно".
    File name: "statement_KaspiBank_january.xlsx"
    Answer: Каспи`;

export const detectBank = async (content: string) => {
  const { text } = await generateText({
    model: openai("gpt-4.1-mini"),
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content },
    ],
  });

  return text;
};
