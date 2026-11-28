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

import {
  renderReport
} from "./report-renderer.js";

import {
  exportReportsToDocx,
  createDocxBlob
} from "./docx-export.js";


const ALL = "__ALL__";


/**
 * Get the agency name from an imported participant record.
 *
 * Agency must be mapped from the exact CSV field "Agency".
 * Ministry and Statutory Board must not be used as substitutes.
 */
function agencyOf(record) {
  const agency = String(record.agency ?? "").trim();

  return agency || "Unassigned";
}


/**
 * Return unique agency names, sorted alphabetically.
 */
function agencies(records) {
  const uniqueAgencies = new Map();

  records.forEach(record => {
    const name = agencyOf(record)
      .replace(/\s+/g, " ")
      .trim();

    const key = name.toLowerCase();

    if (!uniqueAgencies.has(key)) {
      uniqueAgencies.set(key, name);
    }
  });

  return [...uniqueAgencies.values()].sort(
    (a, b) => a.localeCompare(b)
  );
}


/**
 * Refresh the agency dropdown after importing data.
 */
function refreshAgencyPicker() {
  const records = readParticipants();
  const select = $("agencySelect");

  const previousSelection = select.value;
  const agencyNames = agencies(records);

  select.replaceChildren(
    new Option("All agencies (combined)", ALL)
  );

  agencyNames.forEach(name => {
    const count = records.filter(
      record => agencyOf(record) === name
    ).length;

    select.add(
      new Option(`${name} (${count})`, name)
    );
  });

  select.value = agencyNames.includes(previousSelection)
    ? previousSelection
    : ALL;

  $("datasetSummary").textContent =
    `${records.length} imported rows · ` +
    `${agencyNames.length} agencies detected`;

  return agencyNames;
}


/**
 * Return records for the selected agency.
 */
function selectedRecords(
  name = $("agencySelect").value
) {
  const records = readParticipants();

  if (name === ALL) {
    return records;
  }

  return records.filter(
    record => agencyOf(record) === name
  );
}


/**
 * Report metadata.
 */
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

      perProductivity: Number(
        $("psdProductivity").value
      ),

      perLeadership: Number(
        $("psdLeadership").value
      )
    }
  };
}


/**
 * Generate the report for the selected agency.
 */
function build(
  name = $("agencySelect").value
) {
  const records = selectedRecords(name);

  if (!records.length) {
    $("overview").textContent =
      "Import a Tableau CSV or enter participant rows first.";

    return null;
  }

  renderReport(
    records,
    metadata(name)
  );

  return $("report").cloneNode(true);
}


/**
 * Refresh agency list and generate the report.
 */
function generate() {
  refreshAgencyPicker();

  return Boolean(build());
}


/**
 * Generate reports for all agencies.
 */
function allReports() {
  const agencyNames = agencies(
    readParticipants()
  );

  return agencyNames.map(name => {
    build(name);

    return $("report").cloneNode(true);
  });
}


/**
 * Make a safe filename.
 */
function safeFile(value) {
  return String(value || "Agency")
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_|_$/g, "");
}


/**
 * Export report HTML.
 */
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


/**
 * Initialise the application.
 */
function setup() {

  // Create participant table headings.
  $("inputHeaders").innerHTML =
    FIELDS.map(field =>
      `<th>${escapeHTML(field.label)}</th>`
    ).join("") +
    "<th>Remove</th>";


  // Default assessment date.
  $("date").value = new Date()
    .toISOString()
    .slice(0, 10);


  // Add the initial blank participant row.
  createParticipantRow();


  /**
   * CSV file selection.
   */
  $("file").addEventListener(
    "change",
    async event => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        const result = await importCSV(file);

        $("datasetSummary").textContent =
          `${result.count} source data rows detected. ` +
          `Review the mapping, then click Apply field mapping / import rows.`;

        $("generateAfterImport").disabled = true;

        console.log(
          "CSV loaded. Review the field mapping."
        );

      } catch (error) {
        alert(
          `CSV import failed: ${error.message}`
        );
      }

      event.target.value = "";
    }
  );


  /**
   * Apply CSV mapping and import participant rows.
   */
  $("applyMapping").addEventListener(
    "click",
    () => {
      try {
        const count = applyCSVMapping();

        const agencyNames = refreshAgencyPicker();

        $("generateAfterImport").disabled =
          count === 0;

        $("datasetSummary").textContent =
          `${count} participant rows imported · ` +
          `${agencyNames.length} agencies detected`;

        if (count > 0) {
          generate();
        }

        alert(
          `${count} rows imported.\n\n` +
          `${agencyNames.length} agencies detected.`
        );

      } catch (error) {
        alert(
          `Mapping could not be applied: ${error.message}`
        );
      }
    }
  );


  /**
   * Generate report button beside the import controls.
   */
  $("generateAfterImport").addEventListener(
    "click",
    () => {
      refreshAgencyPicker();

      if (generate()) {
        $("report").scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }
  );


  /**
   * Load sample data.
   */
  $("sample").addEventListener(
    "click",
    () => {
      loadSample();

      refreshAgencyPicker();

      $("generateAfterImport").disabled = false;

      generate();
    }
  );


  /**
   * Download field mapping template.
   */
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


  /**
   * Agency selection.
   */
  $("agencySelect").addEventListener(
    "change",
    generate
  );


  /**
   * Existing Generate / refresh report button.
   */
  $("build").addEventListener(
    "click",
    generate
  );


  /**
   * Export selected agency to Word.
   */
  $("word").addEventListener(
    "click",
    async () => {
      if (!build()) {
        return;
      }

      try {
        const name =
          $("agencySelect").value === ALL
            ? (
                $("company").value ||
                "All_Agencies"
              )
            : $("agencySelect").value;

        await exportReportsToDocx(
          [$("report")],
          `${safeFile(name)}_AHE_Report.docx`
        );

      } catch (error) {
        alert(
          `Word export failed: ${error.message}`
        );
      }
    }
  );


  /**
   * Export separate Word reports for every agency.
   */
  $("wordAll").addEventListener(
    "click",
    async () => {
      if (!readParticipants().length) {
        alert(
          "Import or map the CSV first."
        );

        return;
      }

      if (!window.JSZip) {
        alert(
          "ZIP library did not load. Check your internet connection."
        );

        return;
      }

      try {
        const zip = new JSZip();

        const agencyNames = agencies(
          readParticipants()
        );

        for (const name of agencyNames) {
          const records = selectedRecords(name);

          renderReport(
            records,
            metadata(name)
          );

          const node = $("report").cloneNode(true);

          const blob = await createDocxBlob(
            [node]
          );

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


  /**
   * Print or save PDF.
   */
  $("pdf").addEventListener(
    "click",
    () => {
      if (generate()) {
        window.print();
      }
    }
  );


  /**
   * Export selected agency HTML.
   */
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


  /**
   * Export all agencies as HTML.
   */
  $("htmlAll").addEventListener(
    "click",
    () => {
      if (!readParticipants().length) {
        alert(
          "Import the CSV first."
        );

        return;
      }

      downloadHTML(
        allReports(),
        "AHE_All_Agency_Reports.html"
      );

      generate();
    }
  );

}


// Start the application.
setup();

refreshAgencyPicker();
