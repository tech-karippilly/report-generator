import type { Batch } from "../types";

function toDayMonthYear(dateISO: string): string {
  const d = new Date(dateISO);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function weekday(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("en-US", { weekday: "long" });
}

function formatTimeHM(time24: string): string {
  // expects "HH:MM" from <input type="time">
  const [hStr, mStr] = time24.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export interface DailySessionInput {
  dateISO: string; // yyyy-mm-dd
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone: string; // e.g., Asia/Kolkata
  meetUrl: string;
  batch: Batch;
  greeting?: string; // default: Good Morning Colleagues!
}

export function buildDailySessionText(input: DailySessionInput): string {
  const greeting = input.greeting?.trim() || "Good Morning Colleagues!";
  const dateLine = `${toDayMonthYear(input.dateISO)} - ${weekday(input.dateISO)}`;
  const timeLine = `${formatTimeHM(input.startTime)}–${formatTimeHM(input.endTime)}`;
  const tzLine = `Time zone: ${input.timezone}`;

  const trainerNames = input.batch.trainers.map(t => t.name).join(", ");
  const coordinatorLines = input.batch.coordinators.slice(0, 2).map((c, idx) => `Coordinator ${idx + 1}: ${c.name}`);
  const studentLines = input.batch.students.map((s, i) => `${i + 1}.\t${s.name}`);

  const lines: string[] = [];
  lines.push(greeting);
  lines.push("");
  lines.push(dateLine);
  lines.push(timeLine);
  lines.push(tzLine);
  lines.push("");
  lines.push(`Meet Link:- ${input.meetUrl}`);
  lines.push("");
  lines.push(`Communication Session ${input.batch.code}${input.batch.groupName ? ` - ${input.batch.groupName}` : ''}`);
  lines.push("");
  lines.push(`Trainer:${trainerNames}`);
  lines.push(`----------------------------`);
  if (coordinatorLines.length > 0) lines.push(coordinatorLines[0]);
  if (coordinatorLines.length > 1) lines.push(coordinatorLines[1]);
  lines.push(`-----------------------------`);
  lines.push(...studentLines);
  lines.push("");
  lines.push(`Please try to join 5 minutes before starting time (${formatTimeHM(input.startTime)})`);
  return lines.join("\n");
}


