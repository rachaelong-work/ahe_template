
/**
 * Shared utilities:
 * - DOM lookup
 * - Number formatting
 * - CSV parsing
 * - File downloads
 * - HTML escaping
 */

export const $ = (id) => document.getElementById(id);

export const formatNumber = (value, digits = 1) => {
  if (value == null || !Number.isFinite(Number(value))) {
    return "Not available";
  }

  return Number(value).toFixed(digits);
};

/**
 * Parse CSV safely.
 * Supports commas, semicolons and tabs, quoted values,
 * escaped quotes, and line breaks inside quoted cells.
 */
export function parseCSV(text) {
  text = String(text ?? "").replace(/^\uFEFF/, "");

  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
  const sample = lines.slice(0, 10).join("\n");

  function countDelimiter(delimiter) {
    let count = 0;
    let quoted = false;

    for (let i = 0; i < sample.length; i++) {
      const char = sample[i];
      const next = sample[i + 1];

      if (char === '"' && quoted && next === '"') {
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        count++;
      }
    }

    return count;
  }

  const delimiters = [",", ";", "\t"];
  delimiters.sort((a, b) => countDelimiter(b) - countDelimiter(a));

  const delimiter = delimiters[0];

  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        i++;
      }

      row.push(cell.trim());

      if (row.some(value => value !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());

    if (row.some(value => value !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], {
    type: mimeType
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}
