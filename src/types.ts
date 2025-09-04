export type Phone = string;

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: Phone;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone?: Phone;
}

export interface Batch {
  id: string;
  code: string; // e.g., BCR69 Group 2
  groupName?: string;
  trainers: Person[];
  coordinators: Person[];
  students: Student[];
  defaultMeetUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'another_session';

export interface OtherBatchStudent {
  id: string;
  name: string;
  batchName: string;
}

export interface CombinedSessionStudent {
  id: string;
  name: string;
  batchName: string;
  groupName: string;
  email?: string;
  phone?: string;
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
  anotherSessionStudentIds: string[];
  otherBatchStudents: OtherBatchStudent[];
  combinedSessionStudents: CombinedSessionStudent[];
  trainers: Person[];
  coordinators: Person[];
  tldvUrl?: string;
  meetUrl?: string;
  reportedBy: string; // free text
  createdAt: number;
}

