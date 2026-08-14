// Converts a UvA "Mijn Rooster" CSV export into lib/schedule/uni.ts.
//
// Usage:
//   node scripts/parse-timetable.mjs path/to/timetable.csv
//
// Re-run this whenever a new timetable is exported (e.g. once semester 2's
// schedule is published) to regenerate lib/schedule/uni.ts from scratch.
import fs from "fs";
import path from "path";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/parse-timetable.mjs path/to/timetable.csv");
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, "utf8");

// Minimal CSV parser handling quoted fields with embedded commas.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        field = "";
        if (row.some((f) => f !== "")) rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }
  return rows;
}

const rows = parseCsv(raw);
const header = rows[0];
const data = rows.slice(1);

const idx = (name) => header.indexOf(name);
const iDesc = idx("Description");
const iCode = idx("Course code");
const iStartDate = idx("Start date");
const iStartTime = idx("Start time");
const iEndTime = idx("End time");
const iType = idx("Type");
const iLocation = idx("Location(s)");
// The sub-topic (e.g. "1.1 Introductie") lives in "Comments", not the
// second (duplicate, empty) "Description" column this export format has.
const iSubTopic = idx("Comments");

function toDecimalHours(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return +(h + m / 60).toFixed(4);
}

function slugTime(hhmm) {
  return hhmm.replace(":", "");
}

const sessions = data.map((r, i) => {
  const courseName = r[iDesc];
  const courseCode = r[iCode];
  const date = r[iStartDate];
  const startTime = r[iStartTime];
  const endTime = r[iEndTime];
  const type = r[iType];
  const location = r[iLocation] || "";
  const subTopic = r[iSubTopic] || "";

  const id = `${courseCode}-${date}-${slugTime(startTime)}-${i}`;

  return {
    id,
    date,
    courseCode,
    courseName,
    type,
    start: toDecimalHours(startTime),
    end: toDecimalHours(endTime),
    location,
    note: subTopic,
  };
});

function tsString(s) {
  return JSON.stringify(s ?? "");
}

const lines = [];
lines.push(`// AUTO-GENERATED from ${path.basename(csvPath)} — do not hand-edit.`);
lines.push("// Re-run scripts/parse-timetable.mjs (with a fresh CSV export) to regenerate.");
lines.push('import type { UniSession } from "./types";');
lines.push("");
lines.push("export const UNI_SESSIONS: UniSession[] = [");
for (const s of sessions) {
  lines.push(
    `  { id: ${tsString(s.id)}, date: ${tsString(s.date)}, courseCode: ${tsString(
      s.courseCode
    )}, courseName: ${tsString(s.courseName)}, type: ${tsString(
      s.type
    )}, start: ${s.start}, end: ${s.end}, location: ${tsString(
      s.location
    )}, note: ${tsString(s.note)} },`
  );
}
lines.push("];");
lines.push("");

const outPath = path.join(import.meta.dirname, "..", "lib", "schedule", "uni.ts");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");

console.log(`Parsed ${sessions.length} sessions -> ${outPath}`);
console.log(
  "Date range:",
  sessions[0]?.date,
  "to",
  sessions[sessions.length - 1]?.date
);
