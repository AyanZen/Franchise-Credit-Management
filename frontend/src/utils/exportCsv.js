function needsQuotes(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text);
}

export function escapeCell(value) {
  const text = String(value ?? "");
  if (!needsQuotes(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function csvLine(cells) {
  return cells.map(escapeCell).join(",");
}

export function rowsToCsv(rows, columns) {
  const lines = [
    csvLine(columns.map((c) => c.label)),
    ...rows.map((row) =>
      csvLine(
        columns.map((c) => {
          const val = typeof c.value === "function" ? c.value(row) : row[c.value];
          return val ?? "";
        })
      )
    ),
  ];
  return lines.join("\r\n");
}

export function downloadCsv(filename, content) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
