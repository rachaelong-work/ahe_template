
/**
 * Pure descriptive analysis functions.
 * No clinical thresholds are inferred.
 */

export const readinessStages = [
  "Precontemplation",
  "Contemplation",
  "Preparation",
  "Action",
  "Maintenance"
];

export const avg = values =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

export function values(records, key) {
  return records
    .map(record => record[key])
    .filter(value =>
      typeof value === "number" &&
      Number.isFinite(value)
    );
}

export function summary(records, key) {
  const data = values(records, key);

  return {
    n: data.length,
    mean: avg(data),
    min: data.length ? Math.min(...data) : null,
    max: data.length ? Math.max(...data) : null
  };
}

export function counts(records, key) {
  const result = {};

  records.forEach(record => {
    const value = String(record[key] ?? "").trim();

    if (value) {
      result[value] = (result[value] || 0) + 1;
    }
  });

  return result;
}

export function numericBins(records, key, bins) {
  const data = values(records, key);

  return bins.map(([label, min, max, includeMax = false]) => ({
    label,
    count: data.filter(value =>
      value >= min &&
      (includeMax ? value <= max : value < max)
    ).length
  }));
}

export function analyse(records) {
  const measures = [
    {
      key: "bmi",
      label: "BMI",
      unit: "kg/m²"
    },
    {
      key: "fat",
      label: "Percentage body fat",
      unit: "%"
    },
    {
      key: "smm",
      label: "Skeletal muscle mass",
      unit: "kg"
    },
    {
      key: "sbp",
      label: "Systolic blood pressure",
      unit: "mmHg"
    },
    {
      key: "dbp",
      label: "Diastolic blood pressure",
      unit: "mmHg"
    },
    {
      key: "bal",
      label: "Single-leg balance",
      unit: "sec"
    },
    {
      key: "shoulder",
      label: "Shoulder mobility (average of left/right)",
      unit: "cm"
    },
    {
      key: "grip",
      label: "Handgrip strength",
      unit: "kg"
    },
    {
      key: "sitStand",
      label: "Sit-to-Stand",
      unit: "reps"
    },
    {
      key: "stepHR",
      label: "3-minute step test",
      unit: "bpm"
    }
  ].map(measure => ({
    ...measure,
    ...summary(records, measure.key)
  }));

  const behavior = [
    {
      key: "aerobic",
      label: "Aerobic activity",
      unit: "min/week",
      target: "≥150 min/week",
      meets: value => value >= 150
    },
    {
      key: "strengthDays",
      label: "Strength training",
      unit: "days/week",
      target: "≥2 days/week",
      meets: value => value >= 2
    },
    {
      key: "healthyChoices",
      label: "Healthier food choices",
      unit: "times/week",
      target: "≥5 times/week",
      meets: value => value >= 5
    },
    {
      key: "sedentary",
      label: "Sedentary time",
      unit: "hours/day",
      target: "≤8 hours/day",
      meets: value => value <= 8
    }
  ].map(measure => {
    const data = values(records, measure.key);
    const n = data.length;
    const met = data.filter(measure.meets).length;

    return {
      ...measure,
      n,
      mean: avg(data),
      met,
      percent: n ? met / n * 100 : null
    };
  });

  const readiness = counts(records, "readiness");

  const readinessN = Object.values(readiness)
    .reduce((sum, count) => sum + count, 0);

  const perception = [
    {
      key: "perHealth",
      label: "Health & well-being"
    },
    {
      key: "perActive",
      label: "Sport to stay active"
    },
    {
      key: "perSocial",
      label: "Social connectedness"
    },
    {
      key: "perProductivity",
      label: "Productivity"
    },
    {
      key: "perLeadership",
      label: "Leadership support"
    }
  ].map(item => ({
    ...item,
    ...summary(records, item.key)
  }));

  return {
    n: records.length,
    measures,
    behavior,
    readiness,
    rN: readinessN,
    perception
  };
}

export function categories(records, key) {
  return counts(records, key);
}

export function crossCounts(records, category, group) {
  const result = {};

  records.forEach(record => {
    const categoryValue = String(record[category] ?? "").trim();
    const groupValue = String(record[group] ?? "").trim();

    if (categoryValue && groupValue) {
      result[groupValue] ??= {};

      result[groupValue][categoryValue] =
        (result[groupValue][categoryValue] || 0) + 1;
    }
  });

  return result;
}
