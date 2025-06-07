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
    You are an assistant that analyzes a file name and extracts two things:

    The name of the bank, using one of the following options (if possible):
    ${bankList.join(", ")}
    If the bank cannot be determined, respond with: "Неизвестно"

    The type of document, which can be either:

    bank — if the file likely contains a bank statement

    crm — if the file likely contains CRM system name
    If the type cannot be determined, respond with: "Неизвестно"

    File name: "statement_KaspiBank_january.xlsx"
    Answer: bank

    File name: "Halyk выписки ИП Машанова (1).xlsx"
    Answer: bank
    
    File name: "Villa Sales Aug 27 2024 (1).xls"
    Answer: crm
    
    File name: "Altegio Buddha Spa (1).xlsx"
    Answer: crm
    
    File name: "Retail Demand Report Mar 14 2025.xls"
    Answer: crm
`;

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
