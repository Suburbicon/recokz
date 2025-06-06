export const parseAmount = (
  row: string[],
  index: number | number[],
  isIncome: boolean | boolean[],
): number => {
  if (Array.isArray(index) && Array.isArray(isIncome)) {
    for (let i = 0; i < index.length; i++) {
      const idx = index[i];
      if (row[idx]) {
        const amount = parseFloat(row[idx].toString().replace(",", ".")) || 0;
        return isIncome[i] ? amount : -amount;
      }
    }
    return 0;
  } else if (!Array.isArray(index) && typeof isIncome === "boolean") {
    const value = row[index];
    if (!value) return 0;
    const amount =
      typeof value === "number"
        ? value
        : parseFloat(value.replace(",", ".")) || 0;
    return (isIncome as boolean) ? amount : -amount;
  }
  return 0;
};
