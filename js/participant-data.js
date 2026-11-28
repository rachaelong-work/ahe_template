
/**
 * CSV ingestion and field mapping for Tableau extracts.
 *
 * CSV structure expected:
 * - Header row: Excel row 5 (or detected by header names)
 * - Data: row 6 onwards
 * - Columns A-D: ignored for field mapping
 */

import { $, parseCSV, escapeHTML } from "./utils.js";

export const FIELDS = [
  { id: "agency", label: "Agency", type: "text" },
  { id: "id", label: "Participant ID", type: "text" },
  { id: "age", label: "Age group", type: "text" },
  { id: "sex", label: "Sex", type: "text" },
  { id: "designation", label: "Designation", type: "text" },

  { id: "bmi", label: "BMI", type: "number" },
  { id: "bmiCat", label: "BMI category", type: "text" },
  { id: "fat", label: "Body fat % (PBF)", type: "number" },
  { id: "fatCat", label: "PBF category", type: "text" },
  { id: "smm", label: "Skeletal muscle mass (kg)", type: "number" },
  { id: "smmCat", label: "SMM category", type: "text" },
  { id: "vis", label: "Visceral fat level", type: "number" },

  { id: "bpCategory", label: "Blood pressure category", type: "text" },
  { id: "sbp", label: "Systolic BP (mmHg)", type: "number" },
  { id: "dbp", label: "Diastolic BP (mmHg)", type: "number" },

  { id: "bal", label: "Single-leg balance (sec)", type: "number" },
  { id: "shoulder", label: "Shoulder mobility (cm)", type: "number" },
  { id: "grip", label: "Hand grip (kg)", type: "number" },
  { id: "sitStand", label: "1-min sit-to-stand (reps)", type: "number" },
  { id: "stepHR", label: "3-min step recovery HR (bpm)", type: "number" },
  { id: "fitnessCat", label: "Fitness performance category", type: "text" },

  { id: "aerobic", label: "Aerobic activity (min/week)", type: "number" },
  { id: "aerobicCat", label: "Aerobic activity category", type: "text" },
  { id: "strengthDays", label: "Strength training (days/week)", type: "number" },
  { id: "strengthCat", label: "Strength training category", type: "text" },
  { id: "healthyChoices", label: "Healthier choices (times/week)", type: "number" },
  { id: "healthyCat", label: "Healthier choices category", type: "text" },
  { id: "sedentary", label: "Sedentary hours/day", type: "number" },
  { id: "sedentaryCat", label: "Sedentary category", type: "text" },

  { id: "readiness", label: "Readiness stage", type: "text" },

  { id: "perHealth", label: "Perception: health & well-being", type: "number" },
  { id: "perActive", label: "Perception: sport to stay active", type: "number" },
  { id: "perSocial", label: "Perception: social connectedness", type: "number" },
  { id: "perProductivity", label: "Perception: productivity", type: "number" },
  { id: "perLeadership", label: "Perception: leadership support", type: "number" }
];

const norm = value =>
  String(value ?? "")
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

let rawHeaders = [];
let rawRows = [];
let mapping = {};

const HEADER_ALIASES = {
  agency: [
    "Agency",
    "Ministry / Organ of State",
    "Agency Ministry / Organ of State",
    "Statutory Board"
  ],

  id: [
    "Participant ID",
    "Staff ID",
    "Employee ID"
  ],

  age: [
    "Age group",
    "Age band"
  ],

  sex: [
    "Sex",
    "Gender"
  ],

  designation: [
    "Designation",
    "Do you manage a team in your course of work?"
  ],

  bmi: [
    "Body Mass Index (kg/m^2)",
    "Body Mass Index (kg/m²)",
    "BMI"
  ],

  fat: [
    "Percentage Body Fat (%)",
    "Body fat %",
    "Body fat percentage"
  ],

  smm: [
    "Skeletal Muscle Mass (kg)"
  ],

  smmCat: [
    "SMM Indicator"
  ],

  sbp: [
    "Systolic Blood Pressure (mmHg)"
  ],

  dbp: [
    "Diastolic Blood Pressure (mmHg)"
  ],

  sitStand: [
    "Sit-to-Stand (reps)"
  ],

  grip: [
    "Handgrip Strength (kg)"
  ],

  bal: [
    "Single Leg Balance (seconds)"
  ],

  stepHR: [
    "3-Minute Step Test (bpm)"
  ],

  aerobic: [
    "During a typical week, how many minutes of moderate- to vigorous-intensity aerobic physical activity do you do?"
  ],

  strengthDays: [
    "On average, how many days per week do you engage in muscle-strengthening activities at moderate to vigorous intensity?"
  ],

  healthyChoices: [
    "During a typical week, how often do you try to choose healthier meal and beverage options?"
  ],

  sedentary: [
    "On a typical day, how much time do you usually spend sitting, lying or reclining during waking hours? (Hours, Minutes)"
  ],

  readiness: [
    "How ready are you to make changes in your life to improve and/or maintain your health and well-being?"
  ],

  perHealth: [
    "In general, how would you rate your health and well-being?"
  ],

  perActive: [
    "How likely are you to choose sport as a way to stay active/get fitter?"
  ],

  perProductivity: [
    "On a typical day, how productive do you feel?"
  ],

  perSocial: [
    "To what extent do you feel socially connected to your colleagues?"
  ],

  perLeadership: [
    "To what extent do you feel supported by your leaders in your personal health and well-being?"
  ]
};

function findHeader(headers, candidates) {
  const normalizedHeaders = headers.map(norm);
  const normalizedCandidates = candidates.map(norm);

  // Exact match first
  let index = normalizedHeaders.findIndex(header =>
    normalizedCandidates.includes(header)
  );

  // Partial match second
  if (index < 0) {
    index = normalizedHeaders.findIndex(header =>
      normalizedCandidates.some(candidate =>
        candidate.length > 12 && header.includes(candidate)
      )
    );
  }

  return index >= 0 ? headers[index] : "";
}

function guessMapping(headers) {
  const m = {};

  // Ignore Excel columns A-D in the mapping choices.
  const usableHeaders = headers.slice(4);

  FIELDS.forEach(field => {
    const candidates = [
      field.label,
      ...(HEADER_ALIASES[field.id] || [])
    ];

    m[field.id] = findHeader(usableHeaders, candidates);
  });

  // Do not use a hard-coded Excel column number for Agency.
  // Match the actual header names instead.
  m.agency = findHeader(usableHeaders, [
    "Agency"
  ]);

  // Keep both shoulder measurements for averaging.
  m._shoulderLeft = findHeader(usableHeaders, [
    "Left Shoulder Mobility (cm)"
  ]);

  m._shoulderRight = findHeader(usableHeaders, [
    "Right Shoulder Mobility (cm)"
  ]);

  // Agency hierarchy fallbacks
  m._agencyMinistry = findHeader(usableHeaders, [
    "Ministry / Organ of State",
    "Agency Ministry / Organ of State"
  ]);

  m._agencyStatutory = findHeader(usableHeaders, [
    "Statutory Board"
  ]);

  // Birth year is used to derive age group.
  m._birthYear = findHeader(usableHeaders, [
    "Birth Year"
  ]);

  return m;
}

/**
 * Find the header row from its contents.
 * This avoids assuming the first CSV row contains headers.
 */
function findHeaderRow(rows) {
  const required = [
    "response id",
    "agency",
    "body mass index kg m 2",
    "birth year"
  ];

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const values = rows[i].map(norm);

    const hasAgency = values.includes("agency");
    const hasBMI = values.some(value =>
      value.includes("body mass index")
    );
    const hasSex = values.includes("sex");

    if (hasAgency && hasBMI && hasSex) {
      return i;
    }
  }

  // Your supplied CSV has headers on Excel row 5.
  return 4;
}

export function renderMapping(headers, initial = {}) {
  rawHeaders = headers;

  mapping = {
    ...guessMapping(headers),
    ...initial
  };

  const root = $("columnMapping");

  root.innerHTML = FIELDS.map(field => {
    const choices = headers.slice(4);

    return `
      <label class="mapping-label">
        ${escapeHTML(field.label)}
        <select data-map="${field.id}">
          <option value="">— Not present —</option>
          ${choices.map(header => `
            <option
              value="${escapeHTML(header)}"
              ${mapping[field.id] === header ? "selected" : ""}
            >
              ${escapeHTML(header)}
            </option>
          `).join("")}
        </select>
      </label>
    `;
  }).join("");

  root.hidden = false;

  root.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", () => {
      mapping[select.dataset.map] = select.value;
    });
  });
}

function parseNumeric(value) {
  if (value == null || String(value).trim() === "") {
    return null;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  const match = cleaned.match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const number = Number(match[0]);

  return Number.isFinite(number) ? number : null;
}

function parseSedentary(value) {
  const text = String(value ?? "").trim().toLowerCase();

  if (!text) {
    return null;
  }

  // Example: "8 hours 30 minutes"
  const match = text.match(
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\D*(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)?/
  );

  if (match) {
    return Number(match[1]) + Number(match[2]) / 60;
  }

  // Example: "8, 30" or "8:30"
  const pair = text.match(/^\s*(\d+)\s*[,;:]\s*(\d+)\s*$/);

  if (pair) {
    return Number(pair[1]) + Number(pair[2]) / 60;
  }

  return parseNumeric(text);
}

function getValue(row, header) {
  if (!header) {
    return null;
  }

  const index = rawHeaders.indexOf(header);

  if (index < 0) {
    return null;
  }

  return row[index] ?? null;
}

function convertRows() {
  return rawRows.map((row, rowIndex) => {
    const output = {};

    FIELDS.forEach(field => {
      const header = mapping[field.id];
      const value = getValue(row, header);

      if (value == null || String(value).trim() === "") {
        output[field.id] = null;
      } else if (field.id === "sedentary") {
        output[field.id] = parseSedentary(value);
      } else if (field.type === "number") {
        output[field.id] = parseNumeric(value);
      } else {
        output[field.id] = String(value).trim();
      }
    });

    // Use Ministry / Organ of State or Statutory Board
    // if the main Agency field is empty.
    if (!output.agency) {
      const ministry = getValue(row, mapping._agencyMinistry);
      const statutory = getValue(row, mapping._agencyStatutory);

      output.agency = String(
        ministry || statutory || ""
      ).trim() || null;
    }

    // Derive shoulder mobility average.
    const left = parseNumeric(
      getValue(row, mapping._shoulderLeft)
    );

    const right = parseNumeric(
      getValue(row, mapping._shoulderRight)
    );

    if (left !== null || right !== null) {
      output.shoulder =
        left !== null && right !== null
          ? (left + right) / 2
          : (left ?? right);
    }

    // Derive age group from Birth Year.
    const birthYear = parseNumeric(
      getValue(row, mapping._birthYear)
    );

    if (
      birthYear !== null &&
      birthYear > 1900 &&
      birthYear < 2100
    ) {
      const age = new Date().getFullYear() - birthYear;

      output.age =
        age < 30 ? "Under 30" :
        age < 40 ? "30–39" :
        age < 50 ? "40–49" :
        age < 60 ? "50–59" :
        "60+";
    }

    // Do not import empty CSV rows.
    const hasData = row.some(value =>
      String(value ?? "").trim() !== ""
    );

    output._sourceRow = rowIndex + 1;

    return hasData ? output : null;
  }).filter(Boolean);
}

export function createParticipantRow(values = {}) {
  const tr = document.createElement("tr");

  FIELDS.forEach(field => {
    const td = document.createElement("td");
    const input = document.createElement("input");

    input.dataset.key = field.id;
    input.type = field.type;
    input.value = values[field.id] ?? "";

    if (field.type === "number") {
      input.step = "any";
    }

    td.append(input);
    tr.append(td);
  });

  const td = document.createElement("td");
  const button = document.createElement("button");

  button.type = "button";
  button.className = "light";
  button.textContent = "×";
  button.onclick = () => tr.remove();

  td.append(button);
  tr.append(td);

  $("inputTable").querySelector("tbody").append(tr);
}

export function readParticipants() {
  return [
    ...$("inputTable").querySelectorAll("tbody tr")
  ].map(tr => {
    const record = {};

    tr.querySelectorAll("input").forEach(input => {
      const value = input.value.trim();

      record[input.dataset.key] =
        value === ""
          ? null
          : input.type === "number"
            ? parseNumeric(value)
            : value;
    });

    return record;
  }).filter(record =>
    record.agency ||
    FIELDS.slice(5).some(field => record[field.id] != null)
  );
}

export function clearParticipants() {
  $("inputTable")
    .querySelector("tbody")
    .replaceChildren();
}

/**
 * Import CSV:
 * - Detect header row
 * - Use all rows after the header
 * - Keep original column indexes intact
 */
export async function importCSV(file) {
  const text = await file.text();
  const rows = parseCSV(text);

  if (!rows.length) {
    throw new Error("The CSV file is empty.");
  }

  const headerIndex = findHeaderRow(rows);

  if (headerIndex >= rows.length - 1) {
    throw new Error(
      "Could not find the CSV header row or participant data."
    );
  }

  rawHeaders = rows[headerIndex].map(header =>
    String(header ?? "")
      .replace(/^\uFEFF/, "")
      .trim()
  );

  // Excel row 6 onwards, assuming headers are on row 5.
  // If the header is detected elsewhere, use the rows after it.
  rawRows = rows.slice(headerIndex + 1);

  // Remove completely empty rows.
  rawRows = rawRows.filter(row =>
    row.some(value => String(value ?? "").trim() !== "")
  );

  if (!rawRows.length) {
    throw new Error("No participant records were found after the header.");
  }

  renderMapping(rawHeaders);

  console.log("CSV import details:", {
    detectedHeaderRow: headerIndex + 1,
    sourceRows: rawRows.length,
    sourceColumns: rawHeaders.length,
    headers: rawHeaders
  });

  return {
    count: rawRows.length,
    headers: rawHeaders
  };
}

export function applyCSVMapping() {
  const rows = convertRows();

  console.log("Mapped participant rows:", rows.length);

  console.table(
    rows.slice(0, 5).map(row => ({
      Agency: row.agency || "EMPTY",
      BMI: row.bmi ?? "EMPTY",
      BodyFat: row.fat ?? "EMPTY",
      SystolicBP: row.sbp ?? "EMPTY",
      Grip: row.grip ?? "EMPTY",
      SitStand: row.sitStand ?? "EMPTY"
    }))
  );

  clearParticipants();
  rows.forEach(createParticipantRow);

  return rows.length;
}

export function csvTemplate() {
  return FIELDS.map(field =>
    `"${field.label.replaceAll('"', '""')}"`
  ).join(",") + "\n";
}

export function loadSample() {
  const samples = [
    {
      agency: "Agency A",
      age: "30–39",
      sex: "Female",
      designation: "Staff",
      bmi: 24.2,
      fat: 29.1,
      smm: 25.6,
      sbp: 118,
      dbp: 76,
      bal: 28,
      shoulder: 2,
      grip: 27,
      sitStand: 35,
      stepHR: 124,
      aerobic: 90,
      strengthDays: 1,
      healthyChoices: 3,
      sedentary: 9,
      readiness: "Preparation",
      perHealth: 7.1,
      perActive: 7.5,
      perSocial: 7.3,
      perProductivity: 7,
      perLeadership: 7.4
    },
    {
      agency: "Agency B",
      age: "40–49",
      sex: "Male",
      designation: "Manager",
      bmi: 26.1,
      fat: 24.5,
      smm: 32.1,
      sbp: 132,
      dbp: 84,
      bal: 19,
      shoulder: -5,
      grip: 39,
      sitStand: 29,
      stepHR: 132,
      aerobic: 180,
      strengthDays: 2,
      healthyChoices: 5,
      sedentary: 7,
      readiness: "Action",
      perHealth: 6.8,
      perActive: 7.1,
      perSocial: 6.9,
      perProductivity: 7.2,
      perLeadership: 7.1
    }
  ];

  clearParticipants();
  samples.forEach(createParticipantRow);
}
