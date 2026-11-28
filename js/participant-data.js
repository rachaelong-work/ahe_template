
/**
 * CSV ingestion and field mapping for Tableau extracts.
 * Source layout: headers on Excel row 5; records from row 6 onward.
 * Columns A-D are excluded from the mapping controls.
 */
import { $, parseCSV } from "./utils.js";

export const FIELDS = [
  { id: "agency", label: "Agency (CSV Agency field)", type: "text", aliases: ["agency", "agency name", "organisation", "organization", "department", "ministry"] },
  { id: "id", label: "Participant ID", type: "text", aliases: ["response id", "participant id", "id", "staff id", "employee id", "unique id", "record id"] },
  { id: "age", label: "Age group", type: "text", aliases: ["age group", "age band", "age category"] },
  { id: "sex", label: "Sex", type: "text", aliases: ["sex", "gender"] },
  { id: "designation", label: "Management status", type: "text", aliases: ["do you manage a team in your course of work?", "management status", "management", "designation"] },
  { id: "bmi", label: "BMI (kg/m²)", type: "number", aliases: ["body mass index (kg/m^2)", "body mass index (kg/m²)", "body mass index", "bmi"] },
  { id: "fat", label: "Body fat (PBF, %)", type: "number", aliases: ["percentage body fat (%)", "percentage body fat", "body fat %", "body fat percentage", "pbf"] },
  { id: "smm", label: "Skeletal muscle mass (kg)", type: "number", aliases: ["skeletal muscle mass (kg)", "skeletal muscle mass", "smm"] },
  { id: "smmCat", label: "SMM indicator", type: "text", aliases: ["smm indicator", "smm category", "skeletal muscle category"] },
  { id: "bpCategory", label: "Blood pressure category", type: "text", aliases: ["blood pressure category", "bp category", "blood pressure classification"] },
  { id: "sbp", label: "Systolic BP (mmHg)", type: "number", aliases: ["systolic blood pressure (mmhg)", "systolic blood pressure", "sbp"] },
  { id: "dbp", label: "Diastolic BP (mmHg)", type: "number", aliases: ["diastolic blood pressure (mmhg)", "diastolic blood pressure", "dbp"] },
  { id: "bal", label: "Single-leg balance (seconds)", type: "number", aliases: ["single leg balance (seconds)", "single leg balance", "single-leg balance", "balance"] },
  { id: "shoulder", label: "Shoulder mobility average (cm)", type: "number", aliases: ["shoulder mobility", "shoulder mobility cm", "back scratch"] },
  { id: "grip", label: "Handgrip strength (kg)", type: "number", aliases: ["handgrip strength (kg)", "handgrip strength", "hand grip", "grip strength"] },
  { id: "sitStand", label: "Sit-to-Stand (reps)", type: "number", aliases: ["sit-to-stand (reps)", "sit to stand", "sit-to-stand", "sit stand reps"] },
  { id: "stepHR", label: "3-Minute Step Test (bpm)", type: "number", aliases: ["3-minute step test (bpm)", "3-minute step test", "3 minute step test", "step recovery hr"] },
  { id: "fitnessCat", label: "Fitness performance category", type: "text", aliases: ["fitness category", "fitness performance category"] },
  { id: "aerobic", label: "Aerobic activity (min/week)", type: "number", aliases: ["during a typical week how many minutes of moderate to vigorous intensity aerobic physical activity do you do?", "aerobic activity", "aerobic minutes"] },
  { id: "aerobicCat", label: "Aerobic activity category", type: "text", aliases: ["aerobic category", "physical activity category"] },
  { id: "strengthDays", label: "Strength training (days/week)", type: "number", aliases: ["on average how many days per week do you engage in muscle strengthening activities at moderate to vigorous intensity?", "strength training days", "strength days"] },
  { id: "strengthCat", label: "Strength training category", type: "text", aliases: ["strength training category", "strength category"] },
  { id: "healthyChoices", label: "Healthier choices (times/week)", type: "number", aliases: ["during a typical week how often do you try to choose healthier meal and beverage options?", "healthier choices", "healthy food choices"] },
  { id: "healthyCat", label: "Healthier choices category", type: "text", aliases: ["healthier choices category", "healthy meal category"] },
  { id: "sedentary", label: "Sedentary time (hours/day)", type: "number", aliases: ["on a typical day how much time do you usually spend sitting lying or reclining during waking hours hours minutes", "sedentary hours", "sitting hours"] },
  { id: "sedentaryCat", label: "Sedentary category", type: "text", aliases: ["sedentary category", "sedentary behaviour category", "sedentary behavior category"] },
  { id: "readiness", label: "Readiness to change", type: "text", aliases: ["how ready are you to make changes in your life to improve and or maintain your health and well being?", "readiness stage", "readiness to change"] },
  { id: "perHealth", label: "Perception: health & well-being", type: "number", aliases: ["in general how would you rate your health and well being?", "health and well being", "health wellbeing score"] },
  { id: "perActive", label: "Perception: sport to stay active", type: "number", aliases: ["how likely are you to choose sport as a way to stay active get fitter?", "sport to stay active"] },
  { id: "perSocial", label: "Perception: social connectedness", type: "number", aliases: ["to what extent do you feel socially connected to your colleagues?", "social connectedness"] },
  { id: "perProductivity", label: "Perception: productivity", type: "number", aliases: ["on a typical day how productive do you feel?", "productivity perception"] },
  { id: "perLeadership", label: "Perception: leadership support", type: "number", aliases: ["to what extent do you feel supported by your leaders in your personal health and well being?", "leadership support"] }
];

const norm = value => String(value ?? "")
  .replace(/^\uFEFF/, "")
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

let rawHeaders = [];
let rawRows = [];
let mapping = {};

const HEADER_EXACT = {
  agency: ["Agency"],
  id: ["Response ID"],
  sex: ["Sex"],
  designation: ["Do you manage a team in your course of work?"],
  bmi: ["Body Mass Index (kg/m^2)", "Body Mass Index (kg/m²)"],
  fat: ["Percentage Body Fat (%)"],
  smm: ["Skeletal Muscle Mass (kg)"],
  smmCat: ["SMM Indicator"],
  sbp: ["Systolic Blood Pressure (mmHg)"],
  dbp: ["Diastolic Blood Pressure (mmHg)"],
  sitStand: ["Sit-to-Stand (reps)"],
  grip: ["Handgrip Strength (kg)"],
  bal: ["Single Leg Balance (seconds)"],
  stepHR: ["3-Minute Step Test (bpm)"],
  aerobic: ["During a typical week, how many minutes of moderate- to vigorous-intensity aerobic physical activity do you do?"],
  strengthDays: ["On average, how many days per week do you engage in muscle-strengthening activities at moderate to vigorous intensity?"],
  healthyChoices: ["During a typical week, how often do you try to choose healthier meal and beverage options?"],
  sedentary: ["On a typical day, how much time do you usually spend sitting, lying or reclining during waking hours? (Hours, Minutes)"],
  readiness: ["How ready are you to make changes in your life to improve and/or maintain your health and well-being?"],
  perHealth: ["In general, how would you rate your health and well-being?"],
  perActive: ["How likely are you to choose sport as a way to stay active/get fitter?"],
  perProductivity: ["On a typical day, how productive do you feel?"],
  perSocial: ["To what extent do you feel socially connected to your colleagues?"],
  perLeadership: ["To what extent do you feel supported by your leaders in your personal health and well-being?"]
};

function findHeader(headers, candidates) {
  const wanted = candidates.map(norm).filter(Boolean);
  const normalized = headers.map(norm);

  let index = normalized.findIndex(header =>
    wanted.includes(header)
  );

  if (index < 0) {
    index = normalized.findIndex(header =>
      wanted.some(candidate =>
        candidate.length >= 14 && header.includes(candidate)
      )
    );
  }

  return index >= 0 ? headers[index] : "";
}

function guessMapping(headers) {
  // Columns A-D are excluded from mapping controls only.
  // The original header array is retained so column indexes remain correct.
  const available = headers.slice(4);
  const result = {};

  FIELDS.forEach(field => {
    const candidates = [
      ...(HEADER_EXACT[field.id] || []),
      field.label,
      ...(field.aliases || [])
    ];

    result[field.id] = findHeader(available, candidates);
  });

  // Use the exact Agency header. No hard-coded AH index is required.
  result.agency = findHeader(available, ["Agency"]);

  // Fallback agency hierarchy if the Agency cell is blank.
  result._ministry = findHeader(available, ["Ministry / Organ of State"]);
  result._statutory = findHeader(available, ["Statutory Board"]);

  // Additional source fields used to derive values.
  result._birthYear = findHeader(available, ["Birth Year"]);
  result._shoulderLeft = findHeader(available, ["Left Shoulder Mobility (cm)"]);
  result._shoulderRight = findHeader(available, ["Right Shoulder Mobility (cm)"]);

  return result;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

export function renderMapping(headers, initial = {}) {
  rawHeaders = headers;
  mapping = {
    ...guessMapping(headers),
    ...initial
  };

  const root = $("columnMapping");
  const mappingHeaders = headers.slice(4);

  root.innerHTML = `
    <div class="mapping-intro">
      <strong>Review source fields</strong>
      <p>
        Columns A–D are excluded. Agency is matched to the CSV header
        named “Agency”. Management status is derived from the team
        management question. Shoulder mobility is calculated from
        the left and right measurements.
      </p>
    </div>

    ${FIELDS.map(field => `
      <label class="mapping-label">
        <span>${escapeHTML(field.label)}</span>
        <select data-map="${field.id}">
          <option value="">— Not mapped —</option>
          ${mappingHeaders.map(header => `
            <option
              value="${escapeHTML(header)}"
              ${mapping[field.id] === header ? "selected" : ""}
            >
              ${escapeHTML(header)}
            </option>
          `).join("")}
        </select>
      </label>
    `).join("")}
  `;

  root.hidden = false;

  root.querySelectorAll("select[data-map]").forEach(select => {
    select.addEventListener("change", () => {
      mapping[select.dataset.map] = select.value;
    });
  });
}

function parseNumeric(value) {
  if (value == null || String(value).trim() === "") {
    return null;
  }

  const match = String(value)
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim()
    .match(/-?\d+(?:\.\d+)?/);

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

  let match = text.match(
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\D*(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)?/
  );

  if (match) {
    return Number(match[1]) + Number(match[2]) / 60;
  }

  match = text.match(/^\s*(\d+)\s*[,;:]\s*(\d+)\s*$/);

  if (match) {
    return Number(match[1]) + Number(match[2]) / 60;
  }

  return parseNumeric(text);
}

function getValue(row, header) {
  if (!header) {
    return null;
  }

  const index = rawHeaders.indexOf(header);

  return index >= 0 ? (row[index] ?? null) : null;
}

function managementLabel(value) {
  const answer = norm(value);

  if (["yes", "y", "true", "1"].includes(answer)) {
    return "Management";
  }

  if (["no", "n", "false", "0"].includes(answer)) {
    return "Non-management";
  }

  if (!answer) {
    return null;
  }

  return String(value).trim();
}

function convertRows() {
  return rawRows.map(row => {
    const output = {};

    FIELDS.forEach(field => {
      const value = getValue(row, mapping[field.id]);

      if (value == null || String(value).trim() === "") {
        output[field.id] = null;
      } else if (field.id === "designation") {
        output.designation = managementLabel(value);
      } else if (field.id === "sedentary") {
        output.sedentary = parseSedentary(value);
      } else if (field.type === "number") {
        output[field.id] = parseNumeric(value);
      } else {
        output[field.id] = String(value).trim();
      }
    });

    // Use Ministry / Organ of State or Statutory Board only if
    // the standalone Agency field is empty.
    if (!output.agency) {
      output.agency = String(
        getValue(row, mapping._ministry) ||
        getValue(row, mapping._statutory) ||
        ""
      ).trim() || null;
    }

    // Shoulder mobility: average left and right measurements in cm.
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

    // Derive age group from Birth Year if no age group is supplied.
    const birthYear = parseNumeric(
      getValue(row, mapping._birthYear)
    );

    if (
      birthYear !== null &&
      birthYear > 1900 &&
      birthYear < 2100
    ) {
      const age = Math.max(
        0,
        new Date().getFullYear() - birthYear
      );

      output.age =
        age < 30 ? "Under 30" :
        age < 40 ? "30–39" :
        age < 50 ? "40–49" :
        age < 60 ? "50–59" :
        "60+";
    }

    return output;
  }).filter((output, index) =>
    rawRows[index].some(value =>
      String(value ?? "").trim() !== ""
    )
  );
}

function findHeaderRow(rows) {
  // Search the first several rows for the actual Tableau header.
  for (let index = 0; index < Math.min(rows.length, 15); index++) {
    const row = rows[index].map(norm);

    const hasAgency = row.includes("agency");
    const hasBMI = row.some(value =>
      value.includes("body mass index")
    );
    const hasSex = row.includes("sex");
    const hasResponse = row.includes("response id");

    if (hasAgency && hasBMI && hasSex && hasResponse) {
      return index;
    }
  }

  // User specified Excel row 5 as the header and row 6 onward as data.
  return 4;
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
  button.setAttribute("aria-label", "Remove participant row");
  button.onclick = () => tr.remove();

  td.append(button);
  tr.append(td);

  $("inputTable").querySelector("tbody").append(tr);
}

export function readParticipants() {
  return [...$("inputTable").querySelectorAll("tbody tr")]
    .map(row => {
      const record = {};

      row.querySelectorAll("input").forEach(input => {
        const value = input.value.trim();

        record[input.dataset.key] =
          value === ""
            ? null
            : input.type === "number"
              ? parseNumeric(value)
              : value;
      });

      return record;
    })
    .filter(record =>
      record.id ||
      record.agency ||
      FIELDS.slice(5).some(field =>
        record[field.id] != null
      )
    );
}

export function clearParticipants() {
  $("inputTable")
    .querySelector("tbody")
    .replaceChildren();
}

export async function importCSV(file) {
  const rows = parseCSV(await file.text());

  if (!rows.length) {
    throw new Error("The CSV file is empty.");
  }

  const headerIndex = findHeaderRow(rows);

  if (headerIndex >= rows.length - 1) {
    throw new Error(
      "Could not find a header row followed by participant records."
    );
  }

  rawHeaders = rows[headerIndex].map(value =>
    String(value ?? "")
      .replace(/^\uFEFF/, "")
      .trim()
  );

  // Header row Excel 5 -> data starts Excel row 6.
  rawRows = rows
    .slice(headerIndex + 1)
    .filter(row =>
      row.some(value => String(value ?? "").trim() !== "")
    );

  renderMapping(rawHeaders);

  return {
    count: rawRows.length,
    headers: rawHeaders
  };
}

export function applyCSVMapping() {
  const rows = convertRows();

  clearParticipants();
  rows.forEach(createParticipantRow);

  return rows.length;
}

export function csvTemplate() {
  return FIELDS
    .map(field =>
      `"${field.label.replaceAll('"', '""')}"`
    )
    .join(",") + "\n";
}

export function loadSample() {
  const sample = [
    {
      agency: "Agency A",
      id: "S001",
      age: "30–39",
      sex: "Female",
      designation: "Management",
      bmi: 24.2,
      fat: 29.1,
      smm: 25.6,
      smmCat: "As supplied",
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
      agency: "Agency A",
      id: "S002",
      age: "40–49",
      sex: "Male",
      designation: "Non-management",
      bmi: 26.1,
      fat: 24.5,
      smm: 32.1,
      smmCat: "As supplied",
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
    },
    {
      agency: "Agency B",
      id: "S003",
      age: "30–39",
      sex: "Female",
      designation: "Non-management",
      bmi: 22.5,
      fat: 26.8,
      smm: 27.9,
      smmCat: "As supplied",
      sbp: 115,
      dbp: 70,
      bal: 34,
      shoulder: 4,
      grip: 31,
      sitStand: 38,
      stepHR: 115,
      aerobic: 45,
      strengthDays: 0,
      healthyChoices: 2,
      sedentary: 10,
      readiness: "Contemplation",
      perHealth: 7.4,
      perActive: 7.3,
      perSocial: 7.2,
      perProductivity: 7,
      perLeadership: 7.6
    }
  ];

  clearParticipants();
  sample.forEach(createParticipantRow);
}
