export const formatBalance = (balanceInKopecks: number) => {
  return (balanceInKopecks / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 2,
  });
};