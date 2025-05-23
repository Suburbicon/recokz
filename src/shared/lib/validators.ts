import { z } from "zod";

export const emailValidator = z
  .string({ message: "Обязательное поле" })
  .min(4, "Строка должна содержать не менее 4 символов");

export const passwordValidator = z
  .string({ message: "Обязательное поле" })
  .min(1, "Строка должна содержать не менее 1 символов");

export const xinValidator = z
  .string({ message: "Обязательное поле" })
  .min(12, {
    message: "Строка должна содержать 12 символов.",
  })
  .max(12, {
    message: "Строка должна содержать 12 символов.",
  });
