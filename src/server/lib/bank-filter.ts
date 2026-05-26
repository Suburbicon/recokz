export type BankName = "Kaspi" | "Halyk";

export function isSignificantBankTransaction(
  meta: unknown,
  bank: BankName,
): boolean {
  if (!meta || typeof meta !== "object" || !("bank" in meta)) return false;
  if ((meta as { bank?: string }).bank !== bank) return false;

  const m = meta as Record<string, unknown>;

  if (bank === "Kaspi") {
    return String(m["КНП"] ?? "") === "190";
  }

  if (bank === "Halyk") {
    const purpose = String(m["Назначение платежа"] ?? "");
    return purpose.includes("Расчеты по карточкам");
  }

  return false;
}
