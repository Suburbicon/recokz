import dayjs from "dayjs";

export const extractDateFromPaymentPurpose = (
  purpose: string | undefined,
): dayjs.Dayjs | null => {
  if (!purpose) return null;

  const dateMatch = purpose.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!dateMatch) return null;

  const [, first, second, year] = dateMatch;

  const dateDDMM = dayjs(
    `${first.padStart(2, "0")}/${second.padStart(2, "0")}/${year}`,
    "DD/MM/YYYY",
    true,
  );
  if (dateDDMM.isValid()) return dateDDMM;

  const dateMMDD = dayjs(
    `${first.padStart(2, "0")}/${second.padStart(2, "0")}/${year}`,
    "MM/DD/YYYY",
    true,
  );
  if (dateMMDD.isValid()) return dateMMDD;

  return null;
};
