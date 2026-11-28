
/**
 * HTML report, source-aligned graphs, and detailed appendix chart generation.
 */

import {
  $,
  formatNumber,
  escapeHTML
} from "./utils.js";

import {
  analyse,
  categories,
  crossCounts,
  readinessStages
} from "./assessment-analysis.js";

const palette = [
  "#1d6f9f",
  "#42a58b",
  "#e3a33c",
  "#7c72bd",
  "#d66a62",
  "#6c8eaa",
  "#9bbf62"
];

const esc = escapeHTML;

function svgBar(
  title,
  items,
  {
    max = null,
    unit = "",
    width = 650,
    height = null
  } = {}
) {
  items = items.filter(item =>
    item.label &&
    Number.isFinite(Number(item.value))
  );

  if (!items.length) {
    return `<p class="hint">No valid data available for ${esc(title)}.</p>`;
  }

  max = max ?? Math.max(
    1,
    ...items.map(item => Number(item.value))
  );

  height = height ?? Math.max(
    110,
    items.length * 34 + 45
  );

  const left = 190;
  const plot = width - left - 65;
  const rowH = (height - 35) / items.length;

  return `
    <div class="figure">
      <div class="figure-title">${esc(title)}</div>

      <svg
        class="chart-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${width} ${height}"
        role="img"
        aria-label="${esc(title)}"
      >
        ${items.map((item, index) => {
          const y = 25 + index * rowH;
          const value = Number(item.value);
          const barWidth = Math.max(0, value / max * plot);

          return `
            <text
              x="${left - 10}"
              y="${y + rowH * 0.65}"
              text-anchor="end"
              font-size="12"
              fill="#34495e"
            >${esc(item.label)}</text>

            <rect
              x="${left}"
              y="${y + 4}"
              width="${plot}"
              height="${rowH * 0.55}"
              rx="5"
              fill="#edf2f6"
            />

            <rect
              x="${left}"
              y="${y + 4}"
              width="${barWidth}"
              height="${rowH * 0.55}"
              rx="5"
              fill="${palette[index % palette.length]}"
            />

            <text
              x="${left + barWidth + 7}"
              y="${y + rowH * 0.65}"
              font-size="12"
              fill="#20384c"
            >${formatNumber(value, 1)}${esc(unit)}</text>
          `;
        }).join("")}
      </svg>
    </div>
  `;
}

function svgDonut(title, items) {
  const total = items.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  if (!total) {
    return `<p class="hint">No valid data available for ${esc(title)}.</p>`;
  }

  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const arcs = items.map((item, index) => {
    const length = Number(item.value) / total * circumference;

    const segment = `
      <circle
        cx="95"
        cy="95"
        r="${radius}"
        fill="none"
        stroke="${palette[index % palette.length]}"
        stroke-width="25"
        stroke-dasharray="${length} ${circumference - length}"
        stroke-dashoffset="${-offset}"
      />
    `;

    offset += length;
    return segment;
  }).join("");

  return `
    <div class="figure">
      <div class="figure-title">${esc(title)}</div>

      <div class="donut-wrap">
        <svg
          class="chart-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 190 190"
          role="img"
        >
          <g transform="rotate(-90 95 95)">
            ${arcs}
          </g>

          <text
            x="95"
            y="92"
            text-anchor="middle"
            font-size="23"
            font-weight="700"
            fill="#123d60"
          >${total}</text>

          <text
            x="95"
            y="111"
            text-anchor="middle"
            font-size="10"
            fill="#64788b"
          >participants</text>
        </svg>

        <div class="legend">
          ${items.map((item, index) => `
            <div>
              <i style="background:${palette[index % palette.length]}"></i>
              ${esc(item.label)}
              <b>${item.value} (${formatNumber(item.value / total * 100, 1)}%)</b>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function categoryItems(categoryCounts) {
  return Object.entries(categoryCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function metricTable(measures) {
  return `
    <table>
      <thead>
        <tr>
          <th>Measure</th>
          <th>Mean</th>
          <th>Valid n</th>
          <th>Unit</th>
          <th>Range</th>
        </tr>
      </thead>

      <tbody>
        ${measures.filter(measure => measure.n).map(measure => `
          <tr>
            <td>${esc(measure.label)}</td>
            <td>${formatNumber(measure.mean)}</td>
            <td>${measure.n}</td>
            <td>${esc(measure.unit)}</td>
            <td>${formatNumber(measure.min)}–${formatNumber(measure.max)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function subgroupCharts(records, category, title) {
  const groups = ["age", "sex", "designation"]
    .filter(group =>
      Object.keys(categories(records, group)).length
    );

  return groups.map(group => {
    const matrix = crossCounts(records, category, group);
    const groupNames = Object.keys(matrix);

    const categoryNames = [
      ...new Set(
        Object.values(matrix).flatMap(values =>
          Object.keys(values)
        )
      )
    ];

    const width = 700;
    const left = 160;
    const plot = width - left - 25;
    const row = 28;

    const height = Math.max(
      100,
      groupNames.length * row + 48
    );

    const max = Math.max(
      1,
      ...groupNames.map(name =>
        Object.values(matrix[name]).reduce(
          (sum, count) => sum + count,
          0
        )
      )
    );

    let svg = `
      <div class="figure">
        <div class="figure-title">
          ${esc(title)} distribution by ${esc(group)}
        </div>

        <svg
          class="chart-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 ${width} ${height}"
        >
    `;

    groupNames.forEach((name, index) => {
      const y = 22 + index * row;

      const total = Object.values(matrix[name]).reduce(
        (sum, count) => sum + count,
        0
      );

      svg += `
        <text
          x="${left - 9}"
          y="${y + 17}"
          text-anchor="end"
          font-size="12"
          fill="#34495e"
        >${esc(name)}</text>
      `;

      let x = left;

      categoryNames.forEach((categoryName, categoryIndex) => {
        const value = matrix[name][categoryName] || 0;
        const barWidth = value / max * plot;

        svg += `
          <rect
            x="${x}"
            y="${y}"
            width="${barWidth}"
            height="19"
            fill="${palette[categoryIndex % palette.length]}"
          />

          <title>
            ${esc(name)} — ${esc(categoryName)}: ${value}
          </title>
        `;

        x += barWidth;
      });

      svg += `
        <text
          x="${left + total / max * plot + 5}"
          y="${y + 14}"
          font-size="11"
          fill="#243b50"
        >n=${total}</text>
      `;
    });

    svg += `
        </svg>

        <div class="legend">
          ${categoryNames.map((categoryName, index) => `
            <span>
              <i style="background:${palette[index % palette.length]}"></i>
              ${esc(categoryName)}
            </span>
          `).join("")}
        </div>
      </div>
    `;

    return svg;
  }).join("");
}

function svgCompare(title, agency, benchmark) {
  const valid = agency.filter(item =>
    Number.isFinite(item.value)
  );

  if (!valid.length) {
    return `<p class="hint">No perception data available.</p>`;
  }

  const max = 10;
  const width = 700;
  const left = 190;
  const plot = width - left - 95;
  const row = 43;
  const height = valid.length * row + 45;

  return `
    <div class="figure">
      <div class="figure-title">${esc(title)}</div>

      <svg
        class="chart-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${width} ${height}"
      >
        ${valid.map((item, index) => {
          const y = 20 + index * row;
          const agencyWidth = item.value / max * plot;

          const benchmarkValue = benchmark[item.key];
          const benchmarkWidth = benchmarkValue == null
            ? 0
            : benchmarkValue / max * plot;

          return `
            <text
              x="${left - 8}"
              y="${y + 17}"
              text-anchor="end"
              font-size="12"
              fill="#34495e"
            >${esc(item.label)}</text>

            <rect
              x="${left}"
              y="${y}"
              width="${agencyWidth}"
              height="13"
              fill="#176fa5"
            />

            <text
              x="${left + agencyWidth + 5}"
              y="${y + 11}"
              font-size="10"
            >${formatNumber(item.value, 1)}</text>

            <rect
              x="${left}"
              y="${y + 17}"
              width="${benchmarkWidth}"
              height="13"
              fill="#e3a33c"
            />

            <text
              x="${left + benchmarkWidth + 5}"
              y="${y + 28}"
              font-size="10"
            >${formatNumber(benchmarkValue, 1)}</text>
          `;
        }).join("")}
      </svg>

      <div class="legend">
        <span><i style="background:#176fa5"></i>Agency mean</span>
        <span><i style="background:#e3a33c"></i>PSD benchmark</span>
      </div>

      <p class="meta">
        Scale: 1–10. Benchmark values shown are the editable AHE template values.
      </p>
    </div>
  `;
}

export function renderReport(records, meta) {
  const m = analyse(records);
  const company = meta.company || "Agency";

  $("outCompany").textContent =
    `${company} | Corporate Health & Fitness Report`;

  $("outMeta").textContent =
    `Assessment: ${meta.programme || "AHE health and fitness assessment"} · ` +
    `Date: ${meta.date || "Not stated"} · ` +
    `Participants: ${m.n} · ` +
    `Prepared by: ${meta.author || "Not stated"}`;

  $("overview").textContent =
    `This report summarises group-level findings for ${m.n} participants from ${company}. ` +
    `Results include demographics, health indicators, fitness performance, lifestyle behaviours, ` +
    `readiness to change and perception of personal/workplace well-being. ` +
    `Results describe the supplied dataset and are not clinical diagnoses.`;

  $("aboutOut").textContent =
    meta.about ||
    "This report follows the section structure of the AHE 6.0 report template. " +
    "Data were imported from a Tableau CSV extract and analysed at group level.";

  $("demoNarrative").textContent =
    `${m.n} participant records are included. Demographic graphs use available age-group, sex and designation fields.`;

  $("demoBars").innerHTML =
    svgBar(
      "Figure 1. Participant age-group distribution",
      categoryItems(categories(records, "age"))
    ) +
    svgDonut(
      "Figure 2a. Participant sex distribution",
      categoryItems(categories(records, "sex"))
    ) +
    svgDonut(
      "Figure 2b. Management and non-management distribution",
      categoryItems(categories(records, "designation"))
    );

  const bloodPressureCategories = categories(records, "bpCategory");

  $("bpCharts").innerHTML =
    Object.keys(bloodPressureCategories).length
      ? svgDonut(
          "Figure 3. Blood pressure categories",
          categoryItems(bloodPressureCategories)
        )
      : svgBar(
          "Figure 3. Blood pressure values (category not supplied)",
          [
            {
              label: "Mean systolic BP",
              value: m.measures.find(item => item.key === "sbp").mean
            },
            {
              label: "Mean diastolic BP",
              value: m.measures.find(item => item.key === "dbp").mean
            }
          ],
          { unit: " mmHg" }
        );

  // Body composition excludes BMI category, PBF category and visceral fat.
  const bodyCharts = [
    {
      key: "smmCat",
      label: "Skeletal muscle mass (SMM)"
    }
  ];

  $("bodyCharts").innerHTML =
    bodyCharts.map(item =>
      svgDonut(
        `${item.label} category distribution`,
        categoryItems(categories(records, item.key))
      )
    ).join("") +
    svgBar(
      "Group body composition averages",
      m.measures
        .filter(item =>
          ["bmi", "fat", "smm"].includes(item.key) && item.n
        )
        .map(item => ({
          label: item.label,
          value: item.mean
        }))
    );

  $("healthTables").innerHTML =
    metricTable(
      m.measures.filter(item =>
        ["bmi", "fat", "smm", "sbp", "dbp"].includes(item.key)
      )
    ) +
    subgroupCharts(records, "smmCat", "SMM category") +
    subgroupCharts(records, "bpCategory", "Blood pressure category");

  $("fitnessCharts").innerHTML =
    svgBar(
      "Fitness assessment mean results",
      m.measures
        .filter(item =>
          ["bal", "shoulder", "grip", "sitStand", "stepHR"].includes(item.key) &&
          item.n
        )
        .map(item => ({
          label: item.label,
          value: item.mean
        }))
    ) +
    svgDonut(
      "Fitness performance categories",
      categoryItems(categories(records, "fitnessCat"))
    );

  $("fitnessTables").innerHTML =
    metricTable(
      m.measures.filter(item =>
        ["bal", "shoulder", "grip", "sitStand", "stepHR"].includes(item.key)
      )
    ) +
    subgroupCharts(
      records,
      "fitnessCat",
      "Fitness performance category"
    );

  const lifestyle = m.behavior;

  $("lifestyleCharts").innerHTML =
    lifestyle.map(item =>
      svgBar(
        `${item.label}: indicator attainment`,
        [
          {
            label: `Meeting ${item.target}`,
            value: item.percent ?? 0
          },
          {
            label: "Not meeting / other",
            value: item.percent == null ? 0 : 100 - item.percent
          }
        ],
        {
          max: 100,
          unit: "%"
        }
      )
    ).join("") +
    svgDonut(
      "Figure 5. Aerobic activity category",
      categoryItems(categories(records, "aerobicCat"))
    ) +
    svgDonut(
      "Strength training category",
      categoryItems(categories(records, "strengthCat"))
    ) +
    svgDonut(
      "Healthier choices category",
      categoryItems(categories(records, "healthyCat"))
    ) +
    svgDonut(
      "Sedentary behaviour category",
      categoryItems(categories(records, "sedentaryCat"))
    );

  $("lifestyleTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Behaviour</th>
          <th>Mean</th>
          <th>Valid n</th>
          <th>AHE indicator</th>
          <th>Meeting indicator</th>
        </tr>
      </thead>

      <tbody>
        ${lifestyle.map(item => `
          <tr>
            <td>${esc(item.label)}</td>
            <td>${formatNumber(item.mean)}</td>
            <td>${item.n}</td>
            <td>${esc(item.target)}</td>
            <td>
              ${
                item.percent == null
                  ? "Not available"
                  : `${item.met}/${item.n} (${formatNumber(item.percent, 1)}%)`
              }
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  $("appendixLifestyle").innerHTML = [
    "aerobicCat",
    "strengthCat",
    "healthyCat",
    "sedentaryCat"
  ].map((key, index) =>
    subgroupCharts(
      records,
      key,
      [
        "Aerobic activity",
        "Strength training",
        "Healthier food choices",
        "Sedentary behaviour"
      ][index]
    )
  ).join("");

  const readinessItems = categoryItems(m.readiness);

  $("readinessCharts").innerHTML =
    svgBar(
      "Figure 6. Readiness to improve or maintain health and well-being",
      readinessItems,
      {
        max: Math.max(
          1,
          ...readinessItems.map(item => item.value)
        )
      }
    );

  $("readinessTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Stage</th>
          <th>Participants</th>
          <th>Valid response %</th>
        </tr>
      </thead>

      <tbody>
        ${readinessStages.map(stage => `
          <tr>
            <td>${stage}</td>
            <td>${m.readiness[stage] || 0}</td>
            <td>
              ${
                m.rN
                  ? formatNumber((m.readiness[stage] || 0) / m.rN * 100, 1) + "%"
                  : "—"
              }
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  $("perceptionCharts").innerHTML =
    svgCompare(
      "Figure / Table 5. Agency perception scores compared with PSD",
      m.perception.filter(item => item.n),
      meta.psd || {}
    );

  $("perceptionTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Perception domain</th>
          <th>Agency mean</th>
          <th>Valid n</th>
          <th>PSD benchmark</th>
        </tr>
      </thead>

      <tbody>
        ${m.perception.map(item => `
          <tr>
            <td>${esc(item.label)}</td>
            <td>${item.n ? formatNumber(item.mean, 1) : "—"}</td>
            <td>${item.n}</td>
            <td>${formatNumber((meta.psd || {})[item.key], 1)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  $("appendixTables").innerHTML = `
    <h4>Data completeness</h4>

    <table>
      <thead>
        <tr>
          <th>Measure</th>
          <th>Valid records</th>
          <th>Missing / invalid</th>
        </tr>
      </thead>

      <tbody>
        ${m.measures.map(item => `
          <tr>
            <td>${esc(item.label)}</td>
            <td>${item.n}</td>
            <td>${m.n - item.n}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <p class="meta">
      Category graphs use the categorical values present in the Tableau extract.
      The generator does not assign clinical blood-pressure, BMI, PBF or SMM cut-offs.
      BMI category, PBF category and visceral fat level are not included in this report.
      Shoulder mobility is reported in centimetres (cm).
    </p>
  `;

  $("keyFindings").innerHTML = `
    <ul>
      <li>Participant records analysed: ${m.n}.</li>
      <li>Valid body composition measures are shown with their sample sizes.</li>
      <li>Behavioural indicator attainment and readiness-stage distributions are descriptive of the imported data.</li>
    </ul>
  `;

  $("execRecs").innerHTML = `
    <ul>
      <li>Use the agency profile to prioritise inclusive, evidence-informed health promotion.</li>
      <li>Review subgroup patterns carefully and protect participant confidentiality.</li>
      <li>Match health engagement to the reported readiness stages.</li>
    </ul>
  `;

  $("recommendations").innerHTML = `
    <ol>
      <li>Use the agency profile to prioritise inclusive, evidence-informed health promotion and fitness opportunities.</li>
      <li>Where subgroup differences appear, confirm data completeness and avoid interpretation of small groups.</li>
      <li>Support behaviour change with practical workplace access, goal-setting and follow-up matched to readiness.</li>
      <li>Repeat assessments under standardised protocols to monitor group-level change over time.</li>
    </ol>
  `;

  $("programmeIdeas").innerHTML = `
    <p>
      Potential offerings: health assessment and check-in, progressive strength and balance sessions,
      aerobic conditioning, nutrition and lifestyle workshops, and behaviour-change coaching.
      Select offerings with qualified practitioners and agency priorities.
    </p>
  `;

  $("limitations").textContent =
    meta.limits ||
    "Results are based on the Tableau CSV fields mapped during import. " +
    "Missing or invalid values are excluded from measure summaries. " +
    "Use de-identified records, suppress small subgroups where needed, " +
    "and interpret scores with the assessment protocol and approved norms.";

  return m;
}
