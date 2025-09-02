export type Phone = string;

export interface Student {
  id: string;
  name: string;
  phone?: Phone;
}

export interface Person {
  id: string;
  name: string;
  phone?: Phone;
}

export interface Batch {
  id: string;
  code: string; // e.g., BCR69 Group 2
  trainers: Person[];
  coordinators: Person[];
  students: Student[];
  createdAt: number;
  updatedAt: number;
}

export interface SessionReport {
  id: string;
  batchId: string;
  batchCode: string;
  dateISO: string; // yyyy-mm-dd
  activityTitle: string; // e.g., "Today's Activity – Roleplay"
  activityDescription?: string;
  presentStudentIds: string[];
  absenteeStudentIds: string[];
  trainers: Person[];
  coordinators: Person[];
  tldvUrl?: string;
  meetUrl?: string;
  reportedBy: string; // free text
  createdAt: number;
}

