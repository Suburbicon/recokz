import * as XLSX from "xlsx";

export const parse = async (buffer: Buffer) => {
  const workbook = XLSX.read(buffer, { type: "array" });

  // Iterate through all sheets starting from index 0
  for (let i = 0; i < workbook.SheetNames.length; i++) {
    const sheetName = workbook.SheetNames[i];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    // Check if sheet has data (not empty and has at least one non-empty row)
    if (data && data.length > 0 && data.some((row) => row && row.length > 10)) {
      return data;
    }
  }

  // If no sheet has data, return empty array
  return [];
};
