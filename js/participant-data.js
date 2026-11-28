/** CSV ingestion and field mapping for Tableau extracts. */ 

import { $, parseCSV } from "./utils.js";

export const FIELDS = [
  {
    id: "agency",
    label: "Agency",
    type: "text",
    aliases: ["agency", "organisation", "organization", "department", "ministry", "agency name"]
  },
  {
    id: "id",
    label: "Participant ID",
    type: "text",
    aliases: ["participant id", "id", "staff id", "employee id", "unique id", "record id"]
  },
  {
    id: "age",
    label: "Age group",
    type: "text",
    aliases: ["age group", "age band", "age category"]
  },
  {
    id: "sex",
    label: "Sex",
    type: "text",
    aliases: ["sex", "gender"]
  },
  {
    id: "designation",
    label: "Designation",
    type: "text",
    aliases: ["designation", "management", "job level", "staff category", "appointment"]
  },
  {
    id: "bmi",
    label: "BMI",
    type: "number",
    aliases: ["bmi", "body mass index", "body mass index (bmi)"]
  },
  {
    id: "bmiCat",
    label: "BMI category",
    type: "text",
    aliases: ["bmi category", "bmi classification", "bmi group"]
  },
  {
    id: "fat",
    label: "Body fat % (PBF)",
    type: "number",
    aliases: ["pbf", "body fat %", "body fat percentage", "percent body fat", "percentage body fat"]
  },
  {
    id: "fatCat",
    label: "PBF category",
    type: "text",
    aliases: ["pbf category", "body fat category", "body fat classification"]
  },
  {
    id: "smm",
    label: "Skeletal muscle mass (kg)",
    type: "number",
    aliases: ["smm", "skeletal muscle mass", "skeletal muscle mass kg"]
  },
  {
    id: "smmCat",
    label: "SMM category",
    type: "text",
    aliases: ["smm category", "skeletal muscle category", "skeletal muscle mass category"]
  },
  {
    id: "vis",
    label: "Visceral fat level",
    type: "number",
    aliases: ["vis", "visceral fat", "visceral fat level"]
  },
  {
    id: "bpCategory",
    label: "Blood pressure category",
    type: "text",
    aliases: ["blood pressure category", "bp category", "blood pressure classification", "hypertension category"]
  },
  {
    id: "sbp",
    label: "Systolic BP (mmHg)",
    type: "number",
    aliases: ["sbp", "systolic", "systolic blood pressure", "systolic bp"]
  },
  {
    id: "dbp",
    label: "Diastolic BP (mmHg)",
    type: "number",
    aliases: ["dbp", "diastolic", "diastolic blood pressure", "diastolic bp"]
  },
  {
    id: "bal",
    label: "Single-leg balance (sec)",
    type: "number",
    aliases: ["single leg balance", "single-leg balance", "balance eyes closed", "balance", "slb", "single leg balance eyes closed"]
  },
  {
    id: "shoulder",
    label: "Shoulder mobility (cm)",
    type: "number",
    aliases: ["shoulder mobility", "back scratch", "back scratch test", "shoulder mobility cm"]
  },
  {
    id: "grip",
    label: "Hand grip (kg)",
    type: "number",
    aliases: ["hand grip", "handgrip", "grip strength", "handgrip strength", "grip"]
  },
  {
    id: "sitStand",
    label: "1-min sit-to-stand (reps)",
    type: "number",
    aliases: ["sit to stand", "sit-to-stand", "1 minute sit to stand", "1-min sit-to-stand", "sit stand reps"]
  },
  {
    id: "stepHR",
    label: "3-min step recovery HR (bpm)",
    type: "number",
    aliases: ["3 minute step test", "3-min step test", "3mst", "step recovery hr", "post test heart rate", "recovery heart rate"]
  },
  {
    id: "fitnessCat",
    label: "Fitness performance category",
    type: "text",
    aliases: ["fitness category", "fitness performance", "fitness classification", "overall fitness category"]
  },
  {
    id: "aerobic",
    label: "Aerobic activity (min/week)",
    type: "number",
    aliases: ["aerobic activity", "aerobic minutes", "minutes aerobic activity", "moderate vigorous activity minutes", "mvpa minutes", "aerobic min week"]
  },
  {
    id: "aerobicCat",
    label: "Aerobic activity category",
    type: "text",
    aliases: ["aerobic category", "minutes aerobic category", "spag category", "physical activity category"]
  },
  {
    id: "strengthDays",
    label: "Strength training (days/week)",
    type: "number",
    aliases: ["strength training days", "strength days", "strength training frequency", "strength days week"]
  },
  {
    id: "strengthCat",
    label: "Strength training category",
    type: "text",
    aliases: ["strength training category", "strength category"]
  },
  {
    id: "healthyChoices",
    label: "Healthier choices (times/week)",
    type: "number",
    aliases: ["healthier choices", "healthy food choices", "healthy meal options", "healthier meal choices times per week"]
  },
  {
    id: "healthyCat",
    label: "Healthier choices category",
    type: "text",
    aliases: ["healthier choices category", "healthy meal category", "healthier meal category"]
  },
  {
    id: "sedentary",
    label: "Sedentary hours/day",
    type: "number",
    aliases: ["sedentary hours", "sedentary behaviour", "sedentary behavior", "sitting hours", "sedentary hours per day"]
  },
  {
    id: "sedentaryCat",
    label: "Sedentary category",
    type: "text",
    aliases: ["sedentary category", "sedentary behaviour category", "sedentary behavior category"]
  },
  {
    id: "readiness",
    label: "Readiness stage",
    type: "text",
    aliases: ["readiness stage", "stage of change", "stages of change", "readiness to change", "transtheoretical stage"]
  },
  {
    id: "perHealth",
    label: "Perception: health & well-being",
    type: "number",
    aliases: ["health wellbeing score", "health and wellbeing", "health & well-being", "perception health"]
  },
  {
    id: "perActive",
    label: "Perception: sport to stay active",
    type: "number",
    aliases: ["sport to stay active", "physical activity perception", "perception active"]
  },
  {
    id: "perSocial",
    label: "Perception: social connectedness",
    type: "number",
    aliases: ["social connectedness", "social connection perception"]
  },
  {
    id: "perProductivity",
    label: "Perception: productivity",
    type: "number",
    aliases: ["productivity perception", "perceived productivity", "productivity score"]
  },
  {
    id: "perLeadership",
    label: "Perception: leadership support",
    type: "number",
    aliases: ["leadership support", "leadership support score"]
  }
];

const TABLEAU_HEADER_ALIASES = {
  agency: [
    "Agency Ministry / Organ of State",
    "Ministry / Organ of State",
    "Agency"
  ],
  id: ["Response ID"],
  age: ["Birth Year"],
  sex: ["Sex"],
  designation: [
    "Do you manage a team in your course of work?"
  ],
  bmi: ["Body Mass Index (kg/m^2)"],
  fat: ["Percentage Body Fat (%)"],
  smm: ["Skeletal Muscle Mass (kg)"],
  smmCat: ["SMM Indicator"],
  sbp: ["Systolic Blood Pressure (mmHg)"],
  dbp: ["Diastolic Blood Pressure (mmHg)"],
  sitStand: ["Sit-to-Stand (reps)"],
  grip: ["Handgrip Strength (kg)"],
  bal: ["Single Leg Balance (seconds)"],
  stepHR: ["3-Minute Step Test (bpm)"],
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

const norm = s =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

let rawHeaders = [];
let rawRows = [];
let mapping = {};

function guessMapping(headers) {
  const normalized = headers.map(h =>
    norm(String(h).replace(/^\uFEFF/, ""))
  );

  const m = {};

  FIELDS.forEach(f => {
    const candidates = [
      f.label,
      ...f.aliases,
      ...(TABLEAU_HEADER_ALIASES[f.id] || [])
    ].map(norm);

    let ix = normalized.findIndex(h =>
      candidates.includes(h)
    );

    if (ix < 0) {
      ix = normalized.findIndex(h =>
        candidates.some(c => c.length > 7 && h.includes(c))
      );
    }

    m[f.id] = ix >= 0 ? headers[ix] : "";
  });

  // Left and right shoulder mobility are combined into one mean.
  m._shoulderLeft =
    headers.find(h =>
      norm(h) === norm("Left Shoulder Mobility (cm)")
    ) || "";

  m._shoulderRight =
    headers.find(h =>
      norm(h) === norm("Right Shoulder Mobility (cm)")
    ) || "";

  return m;
}

export function renderMapping(headers, initial = {}) {
  rawHeaders = headers;
  mapping = {
    ...guessMapping(headers),
    ...initial
  };

  const root = $("columnMapping");

  root.innerHTML = FIELDS.map(f => `
    <label class="mapping-label">
      ${f.label}
      <select data-map="${f.id}">
        <option value="">— Not present —</option>
        ${headers.map(h => `
          <option
            value="${escapeAttr(h)}"
            ${mapping[f.id] === h ? "selected" : ""}
          >
            ${escapeHTML(h)}
          </option>
        `).join("")}
      </select>
    </label>
  `).join("");

  root.hidden = false;

  root.querySelectorAll("select").forEach(s => {
    s.addEventListener("change", () => {
      mapping[s.dataset.map] = s.value;
    });
  });
}

function escapeHTML(v) {
  return String(v).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function escapeAttr(v) {
  return escapeHTML(v);
}

function convertRows() {
  const lookup = {};

  rawHeaders.forEach((h, i) => {
    lookup[h] = i;
  });

  const get = (row, h) =>
    h ? row[lookup[h]] : null;

  return rawRows
    .map(row => {
      const out = {};

      FIELDS.forEach(f => {
        const h = mapping[f.id];
        const v = get(row, h);

        out[f.id] =
          v == null || String(v).trim() === ""
            ? null
            : f.id === "sedentary"
              ? parseSedentary(v)
              : f.type === "number"
                ? parseNumeric(v)
                : String(v).trim();
      });

      const left = parseNumeric(
        get(row, mapping._shoulderLeft)
      );

      const right = parseNumeric(
        get(row, mapping._shoulderRight)
      );

      if (left !== null || right !== null) {
        out.shoulder =
          left !== null && right !== null
            ? (left + right) / 2
            : left ?? right;
      }

      const birth = parseNumeric(
        get(
          row,
          rawHeaders.find(h =>
            norm(h) === "birth year"
          )
        )
      );

      if (birth !== null && birth > 1900 && birth < 2100) {
        const age = Math.max(
          0,
          new Date().getFullYear() - birth
        );

        out.age =
          age < 30 ? "Under 30" :
          age < 40 ? "30–39" :
          age < 50 ? "40–49" :
          age < 60 ? "50–59" :
          "60+";
      }

      // Keep every non-empty respondent record.
      return out;
    })
    .filter((out, i) =>
      rawRows[i].some(v =>
        String(v ?? "").trim() !== ""
      )
    );
}

function parseSedentary(v) {
  const s = String(v ?? "").trim().toLowerCase();

  if (!s) return null;

  let m = s.match(
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\D*(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)?/
  );

  if (m) {
    return Number(m[1]) + Number(m[2]) / 60;
  }

  m = s.match(/^\s*(\d+)\s*[,;:]\s*(\d+)\s*$/);

  if (m) {
    return Number(m[1]) + Number(m[2]) / 60;
  }

  return parseNumeric(s);
}

function parseNumeric(v) {
  if (v == null) return null;

  const s = String(v)
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  const match = s.match(/-?\d+(?:\.\d+)?/);

  if (!match) return null;

  const n = Number(match[0]);

  return Number.isFinite(n) ? n : null;
}

export function createParticipantRow(values = {}) {
  const tr = document.createElement("tr");

  FIELDS.forEach(f => {
    const td = document.createElement("td");
    const input = document.createElement("input");

    input.dataset.key = f.id;
    input.type = f.type;
    input.value = values[f.id] ?? "";

    if (f.type === "number") {
      input.step = "any";
    }

    td.append(input);
    tr.append(td);
  });

  const td = document.createElement("td");
  const b = document.createElement("button");

  b.type = "button";
  b.className = "light";
  b.textContent = "×";
  b.onclick = () => tr.remove();

  td.append(b);
  tr.append(td);

  $("inputTable").querySelector("tbody").append(tr);
}

export function readParticipants() {
  return [
    ...$("inputTable").querySelectorAll("tbody tr")
  ]
    .map(tr => {
      const r = {};

      tr.querySelectorAll("input").forEach(i => {
        const v = i.value.trim();

        r[i.dataset.key] =
          v === ""
            ? null
            : i.type === "number"
              ? parseNumeric(v)
              : v;
      });

      return r;
    })
    .filter(r =>
      r.id ||
      r.agency ||
      FIELDS.slice(5).some(f => r[f.id] != null)
    );
}

export function clearParticipants() {
  $("inputTable")
    .querySelector("tbody")
    .replaceChildren();
}

export async function importCSV(file) {
  const rows = parseCSV(await file.text());

  if (rows.length < 2) {
    throw Error("CSV has no participant rows.");
  }

  rawHeaders = rows[0];
  rawRows = rows.slice(1);

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
    .map(f =>
      `"${f.label.replaceAll('"', '""')}"`
    )
    .join(",") + "\n";
}

export function loadSample() {
  const samples = [
    {
      agency: "Agency A",
      id: "C001",
      age: "30–39",
      sex: "Female",
      designation: "Staff",
      bmi: 24.2,
      bmiCat: "Normal",
      fat: 29.1,
      fatCat: "Normal",
      smm: 25.6,
      smmCat: "Normal",
      vis: 8,
      bpCategory: "Normal",
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
      id: "C002",
      age: "40–49",
      sex: "Male",
      designation: "Staff",
      bmi: 26.1,
      bmiCat: "Over",
      fat: 24.5,
      fatCat: "Over",
      smm: 32.1,
      smmCat: "Normal",
      vis: 10,
      bpCategory: "High-Normal",
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
      id: "C003",
      age: "30–39",
      sex: "Female",
      designation: "Manager",
      bmi: 22.5,
      bmiCat: "Normal",
      fat: 26.8,
      fatCat: "Normal",
      smm: 27.9,
      smmCat: "Normal",
      vis: 7,
      bpCategory: "Normal",
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
  samples.forEach(createParticipantRow);
}
