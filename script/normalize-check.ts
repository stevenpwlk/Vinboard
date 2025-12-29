import { normalizeColor, normalizeType } from "../shared/normalize";

const cases = [
  { label: "normalizeColor(rosé)", actual: normalizeColor("rosé"), expected: "rose" },
  { label: "normalizeColor(Rose )", actual: normalizeColor("Rose "), expected: "rose" },
  { label: "normalizeColor(ROUGE)", actual: normalizeColor("ROUGE"), expected: "red" },
  { label: "normalizeType(Effervescent)", actual: normalizeType("Effervescent"), expected: "sparkling" },
];

const failures = cases.filter((entry) => entry.actual !== entry.expected);

if (failures.length) {
  failures.forEach((entry) => {
    console.error(`${entry.label} => ${entry.actual} (expected ${entry.expected})`);
  });
  throw new Error("Normalization checks failed");
}

console.log("Normalization checks passed");
