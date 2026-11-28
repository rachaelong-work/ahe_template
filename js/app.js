/** App orchestration: CSV import, agency filtering and export. */ 

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
  const oldValue = select.value;
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

  select.value = names.includes(oldValue)
    ? oldValue
    : ALL;

  $("datasetSummary").textContent =
    `${records.length} rows · ${names.length} agencies`;

  return names;
}

function selectedRecords(
  name = $("agencySelect").value
) {
  const records = readParticipants();

  return name === ALL
    ? records
    : records.filter(record => agencyOf(record) === name);
}

function metadata(name) {
  return {
    company:
      name === ALL
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

  return !!build();
}

function allReports() {
  const names = agencies(readParticipants());

  return names.map(name => {
    build(name);

    return $("report").cloneNode(true);
  });
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

function safeFile(value) {
  return String(value || "Agency")
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_|_$/g, "");
}

function setup() {
  const headers = $("inputHeaders");

  headers.innerHTML =
    FIELDS.map(field =>
      `<th>${escapeHTML(field.label)}</th>`
    ).join("") + "<th>Remove</th>";

  $("date").value = new Date()
    .toISOString()
    .slice(0, 10);

  createParticipantRow();

  // CSV file import
  $("file").addEventListener(
    "change",
    async event => {
      const file = event.target.files?.[0];

      if (!file) return;

      try {
        const result = await importCSV(file);

        const imported = applyCSVMapping();

        refreshAgencyPicker();
        generate();

        $("datasetSummary").textContent =
          `${result.count} source rows detected · ` +
          `${imported} participant rows imported. ` +
          `Review the field mapping and click Apply Mapping ` +
          `if you change any columns.`;
      } catch (error) {
        alert(`CSV import failed: ${error.message}`);
      }

      event.target.value = "";
    }
  );

  // Apply field mapping
  $("applyMapping").addEventListener(
    "click",
    () => {
      try {
        const count = applyCSVMapping();

        refreshAgencyPicker();
        generate();

        alert(
          `${count} rows mapped and imported. ` +
          `Review the selected agency and report.`
        );
      } catch (error) {
        alert(
          `Mapping could not be applied: ${error.message}`
        );
      }
    }
  );

  // Sample data
  $("sample").addEventListener(
    "click",
    () => {
      loadSample();
      refreshAgencyPicker();
      generate();
    }
  );

  // CSV template download
  $("template").addEventListener(
    "click",
    () => {
      downloadFile(
        "AHE_Tableau_Field_Mapping_Template.csv",
        csvTemplate(),
        "text/csv;charset=utf-8"
      );
    }
  );

  // Agency selection
  $("agencySelect").addEventListener(
    "change",
    generate
  );

  // Generate report
  $("build").addEventListener(
    "click",
    generate
  );

  // Export selected agency to Word
  $("word").addEventListener(
    "click",
    async () => {
      if (!build()) return;

      try {
        const agencyName =
          $("agencySelect").value === ALL
            ? $("company").value || "All_Agencies"
            : $("agencySelect").value;

        await exportReportsToDocx(
          [$("report")],
          `${safeFile(agencyName)}_AHE_Report.docx`
        );
      } catch (error) {
        alert(
          `Word export failed: ${error.message}`
        );
      }
    }
  );

  // Export each agency as a separate Word document in a ZIP
  $("wordAll").addEventListener(
    "click",
    async () => {
      if (!readParticipants().length) {
        return alert(
          "Import or map the CSV first."
        );
      }

      if (!window.JSZip) {
        return alert(
          "ZIP library did not load. " +
          "Check your internet connection and reload."
        );
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
    }
  );

  // PDF
  $("pdf").addEventListener(
    "click",
    () => {
      if (generate()) {
        window.print();
      }
    }
  );

  // Export selected agency as HTML
  $("html").addEventListener(
    "click",
    () => {
      const node = build();

      if (node) {
        downloadHTML(
          [node],
          "AHE_Agency_Report.html"
        );
      }
    }
  );

  // Export all agencies as HTML
  $("htmlAll").addEventListener(
    "click",
    () => {
      if (!readParticipants().length) {
        return alert("Import the CSV first.");
      }

      downloadHTML(
        allReports(),
        "AHE_All_Agency_Reports.html"
      );

      generate();
    }
  );
}

setup();
refreshAgencyPicker();
