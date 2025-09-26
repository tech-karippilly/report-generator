import type { Batch, SessionReport } from "../types";

function formatList(items: string[]): string {
  return items.map((text, index) => `${index + 1}.\t${text}`).join("\n");
}

export function buildWhatsappReportText(batch: Batch, report: SessionReport): string {
  const presentNames = batch.students
    .filter(s => report.presentStudentIds.includes(s.id))
    .map(s => s.name);
  const absentNames = batch.students
    .filter(s => report.absenteeStudentIds.includes(s.id))
    .map(s => s.name);
  const anotherSessionNames = batch.students
    .filter(s => report.anotherSessionStudentIds.includes(s.id))
    .map(s => s.name);
  
  const otherBatchStudentNames = report.otherBatchStudents
    .map(s => `${s.name} (${s.batchName})`);
  
  const combinedSessionStudentNames = report.combinedSessionStudents
    .map(s => `${s.name} (${s.batchName} - ${s.groupName})`);

  const trainerNames = report.trainers.map(t => t.name).join(" , ");

  const lines: string[] = [];
  lines.push(`Communication Session Report`);
  lines.push(`-------------------------------------`);
  lines.push(`Batch: ${report.batchCode}${report.groupName ? ` - ${report.groupName}` : ''}`);
  lines.push(`📅 Date: ${new Date(report.dateISO).toLocaleDateString("en-GB")}`);
  lines.push(`--------------------------------------------`);
  lines.push(`Trainers:- ${trainerNames}.`);
  lines.push("");
  lines.push(`Coordinators :`);
  report.coordinators.forEach((c, i) => lines.push(`${i + 1}.\t${c.name}`));
  lines.push(` ---------------------------------`);
  if (report.tldvUrl) lines.push(`📌 Tldv link: ${report.tldvUrl}`);
  if (report.meetUrl) lines.push(`🔗 Session Link:${report.meetUrl}`);
  lines.push("");
  lines.push(` 📝 Report:`);
  lines.push("");
  lines.push(`${report.activityTitle}`);
  if (report.activityDescription) {
    lines.push("");
    lines.push(report.activityDescription);
  }
  lines.push("");
  lines.push(`✅ Present :(${presentNames.length})`);
  lines.push(`---------------------------`);
  lines.push(formatList(presentNames));
  lines.push("");
  
  if (anotherSessionNames.length > 0) {
    lines.push(`🔄 Attending Another Session (${anotherSessionNames.length})`);
    lines.push(`----------------------------------------`);
    lines.push(formatList(anotherSessionNames));
    lines.push("");
  }
  
  if (otherBatchStudentNames.length > 0) {
    lines.push(`👥 Other Batch Students (${otherBatchStudentNames.length})`);
    lines.push(`----------------------------------------`);
    lines.push(formatList(otherBatchStudentNames));
    lines.push("");
  }
  
  if (combinedSessionStudentNames.length > 0) {
    lines.push(`🤝 Combined Session Students (${combinedSessionStudentNames.length})`);
    lines.push(`----------------------------------------`);
    lines.push(formatList(combinedSessionStudentNames));
    lines.push("");
  }
  
  lines.push(`❌ Absentees (${absentNames.length})`);
  lines.push(`-------------------`);
  lines.push(formatList(absentNames));
  lines.push("");
  lines.push(`-------------------------------`);
  lines.push(`🖊reported by : ${report.reportedBy}`);
  return lines.join("\n");
}

