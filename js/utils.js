/** Shared pure utilities: formatting, safe CSV parsing and file downloads. */ 

export const $ = (id) => document.getElementById(id);

export const formatNumber = (value, digits = 1) =>
  value == null || !Number.isFinite(Number(value))
    ? "Not available"
    : Number(value).toFixed(digits);

export function parseCSV(text) {
  // Tableau exports may use comma, semicolon, or tab delimiters depending on locale.
  text = String(text ?? "").replace(/^\uFEFF/, "");

  const firstLine = text.split(/\r?\n/, 1)[0] || "";

  const countOutsideQuotes = delimiter => {
    let n = 0;
    let q = false;

    for (let i = 0; i < firstLine.length; i++) {
      if (firstLine[i] === '"') {
        if (q && firstLine[i + 1] === '"') {
          i++;
        } else {
          q = !q;
        }
      } else if (firstLine[i] === delimiter && !q) {
        n++;
      }
    }

    return n;
  };

  const delimiters = [",", ";", "\t"].sort(
    (a, b) => countOutsideQuotes(b) - countOutsideQuotes(a)
  );

  const delimiter = delimiters[0];
  const rows = [];

  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i++;

      row.push(cell.trim());

      if (row.some(v => v !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell !== "" || row.length) {
    row.push(cell.trim());

    if (row.some(v => v !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

export function downloadFile(filename, content, mimeType) {
  const url = URL.createObjectURL(
    new Blob([content], { type: mimeType })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}
