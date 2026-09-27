import * as XLSX from "xlsx";
import type { Chip } from "@/types/dashboard";

const COLUMNS = [
  { key: "Chip Name", width: 14 },
  { key: "Type", width: 20 },
  { key: "Status", width: 10 },
  { key: "Temperature (°C)", width: 18 },
  { key: "Humidity (%)", width: 14 },
  { key: "Serial Number", width: 18 },
  { key: "Last Updated", width: 22 },
] as const;

export function exportChipsToExcel(chips: Chip[], filename: string) {
  const rows = chips.map((chip) => ({
    "Chip Name": chip.name,
    Type: chip.type,
    Status: chip.status,
    "Temperature (°C)": chip.temperature,
    "Humidity (%)": chip.humidity,
    "Serial Number": chip.serialNumber,
    "Last Updated": chip.lastUpdated,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths based on content — take max of header and all cell values
  worksheet["!cols"] = COLUMNS.map(({ key, width }) => {
    const dataMax = rows.reduce((max, row) => {
      const val = String(row[key as keyof (typeof rows)[0]] ?? "");
      return Math.max(max, val.length);
    }, key.length);
    return { wch: Math.max(dataMax, width) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Chips");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
