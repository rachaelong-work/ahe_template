
/**
 * App orchestration:
 * CSV import, agency filtering, report generation and export.
 */

import {
  $,
  downloadFile,
  escapeHTML
} from "./utils.js";

import {
  createParticipantRow,
  readParticipants,
  importCSV,
  applyCSVMapping,
  csvTemplate,
  loadSample,
  FIELDS
} from "./participant-data.js";

import { renderReport } from "./report-renderer.js";

import {
  exportReportsToDocx,
  createDocxBlob
} from "./docx-export.js";

const ALL = "__ALL__";

function agencyOf(record) {
  return String(record.agency || "").trim() || "Unassigned";
}

function agencies(records) {
  return [
    ...new Set(records.map(agencyOf))
  ].sort((a, b) => a.localeCompare(b));
}

function refreshAgencyPicker() {
  const records = readParticipants();
  const select = $("agencySelect");
  const previous = select.value;
  const names = agencies(records);

  select.replaceChildren(
    new Option("All agencies (combined)", ALL)
  );

  names.forEach(name => {
    const count = records.filter(
      record => agencyOf(record) === name
    ).length;

    select.add(
      new Option(`${name} (${count})`, name)
    );
  });

  select.value = names.includes(previous) ? previous : ALL;

  $("datasetSummary").textContent =
    `${records.length} rows · ${names.length} agencies`;

  return names;
}

function selectedRecords(name = $("agencySelect").value) {
  const records = readParticipants();

  return name === ALL
    ? records
    : records.filter(record => agencyOf(record) === name);
}

function metadata(name) {
  return {
    company: name === ALL
      ? ($("company").value.trim() || "All agencies")
      : name,

    programme: $("programme").value.trim(),
    date: $("date").value,
    author: $("author").value.trim(),
    about: $("about").value.trim(),
    context: $("context").value.trim(),
    limits: $("limits").value.trim(),

    psd: {
      perHealth: Number($("psdHealth").value),
      perActive: Number($("psdActive").value),
      perSocial: Number($("psdSocial").value),
      perProductivity: Number($("psdProductivity").value),
      perLeadership: Number($("psdLeadership").value)
    }
  };
}

function build(name = $("agencySelect").value) {
  const records = selectedRecords(name);

  if (!records.length) {
    $("overview").textContent =
      "Import a Tableau CSV or enter participant rows first.";

    return null;
  }

  renderReport(records, metadata(name));

  return $("report").cloneNode(true);
}

function generate() {
  refreshAgencyPicker();
  return Boolean(build());
}

function allReports() {
  const names = agencies(readParticipants());

  return names.map(name => {
    build(name);
    return $("report").cloneNode(true);
  });
}

function safeFile(value) {
  return String(value || "Agency")
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_|_$/g, "");
}

function downloadHTML(nodes, filename) {
  const css = document.querySelector(
    'link[rel="stylesheet"]'
  ).href;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>AHE agency reports</title>
        <link rel="stylesheet" href="${css}">
        <style>
          .report {
            page-break-after: always;
          }
        </style>
      </head>
      <body>
        ${nodes.map(node => node.outerHTML).join("")}
      </body>
    </html>
  `;

  downloadFile(
    filename,
    html,
    "text/html;charset=utf-8"
  );
}

function setup() {
  const headers = $("inputHeaders");

  headers.innerHTML =
    FIELDS.map(field =>
      `<th>${escapeHTML(field.label)}</th>`
    ).join("") +
    "<th>Remove</th>";

  $("date").value = new Date()
    .toISOString()
    .slice(0, 10);

  createParticipantRow();

  // Import CSV and display mapping.
  // Do not populate the table until the user applies mapping.
  $("file").addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const result = await importCSV(file);

      $("datasetSummary").textContent =
        `${result.count} source rows detected. ` +
        `Review the field mapping, then click Apply field mapping / import rows.`;

      console.log("CSV loaded. Review the mapping panel.");
    } catch (error) {
      alert(`CSV import failed: ${error.message}`);
    }

    event.target.value = "";
  });

  // Apply mapping and import the rows.
  $("applyMapping").addEventListener("click", () => {
    try {
      const count = applyCSVMapping();

      refreshAgencyPicker();
      generate();

      alert(
        `${count} rows imported.\n\n` +
        `Please check the participant table and agency selection.`
      );
    } catch (error) {
      alert(
        `Mapping could not be applied: ${error.message}`
      );
    }
  });

  $("sample").addEventListener("click", () => {
    loadSample();
    refreshAgencyPicker();
    generate();
  });

  $("template").addEventListener("click", () => {
    downloadFile(
      "AHE_Tableau_Field_Mapping_Template.csv",
      csvTemplate(),
      "text/csv;charset=utf-8"
    );
  });

  $("agencySelect").addEventListener("change", generate);
  $("build").addEventListener("click", generate);

  $("word").addEventListener("click", async () => {
    if (!build()) {
      return;
    }

    try {
      const name = $("agencySelect").value === ALL
        ? $("company").value || "All_Agencies"
        : $("agencySelect").value;

      await exportReportsToDocx(
        [$("report")],
        `${safeFile(name)}_AHE_Report.docx`
      );
    } catch (error) {
      alert(`Word export failed: ${error.message}`);
    }
  });

  $("wordAll").addEventListener("click", async () => {
    if (!readParticipants().length) {
      alert("Import or map the CSV first.");
      return;
    }

    if (!window.JSZip) {
      alert("ZIP library did not load. Check your internet connection.");
      return;
    }

    try {
      const zip = new JSZip();
      const names = agencies(readParticipants());

      for (const name of names) {
        const records = selectedRecords(name);

        renderReport(records, metadata(name));

        const node = $("report").cloneNode(true);
        const blob = await createDocxBlob([node]);

        zip.file(
          `${safeFile(name)}_AHE_Report.docx`,
          blob
        );
      }

      const bundle = await zip.generateAsync({
        type: "blob"
      });

      downloadFile(
        "AHE_Separate_Agency_Word_Reports.zip",
        bundle,
        "application/zip"
      );

      generate();
    } catch (error) {
      alert(
        `Separate agency Word export failed: ${error.message}`
      );
    }
  });

  $("pdf").addEventListener("click", () => {
    if (generate()) {
      window.print();
    }
  });

  $("html").addEventListener("click", () => {
    const node = build();

    if (node) {
      downloadHTML(
        [node],
        "AHE_Agency_Report.html"
      );
    }
  });

  $("htmlAll").addEventListener("click", () => {
    if (!readParticipants().length) {
      alert("Import the CSV first.");
      return;
    }

    downloadHTML(
      allReports(),
      "AHE_All_Agency_Reports.html"
    );

    generate();
  });
}

setup();
refreshAgencyPicker();
