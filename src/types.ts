export type Phone = string;

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: Phone;
  points?: number; // Current points, defaults to 100
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

export interface PointUpdate {
  id: string;
  studentId: string;
  studentName: string;
  batchId: string;
  batchCode: string;
  pointsChange: number; // Can be positive or negative
  reason: string; // Text explaining why points were added/removed
  updatedBy: string; // User who made the update
  dateISO: string; // yyyy-mm-dd
  createdAt: number;
}

export interface StudentPoints {
  studentId: string;
  studentName: string;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsLost: number;
  lastUpdated: number;
}

