import { generateText } from "ai";
import { openai } from "@/server/ai/client";

const PROMPT = `
  Given the following image, detect what In this photo there is a piece of paper with text, 
  determine what is written there and write it in the following format:

  [product]: [price]
`;

export const detectImage = async (image_url: string) => {
  const { text } = await generateText({
    model: openai("gpt-4.1"),
    messages: [
      { role: "system", content: PROMPT },
      {
        role: "user",
        content: [
          {
              type: 'text',
              text: 'Please determine what is written there and write it in array: [ "[product]: [price]" ]',
          },
          {
            type: 'image',
            image: image_url
          }
        ],
      },
    ],
  });

  return text;
};
