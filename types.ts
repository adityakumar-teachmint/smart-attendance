
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface Student {
  id: string;
  name: string;
  photo: string; // Base64 encoded
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  confidence: number; // 0-100
  timestamp: number;
}

export interface AttendanceSession {
  id: string;
  date: string;
  records: AttendanceRecord[];
  classroomPhoto: string;
}

export type View = 'dashboard' | 'students' | 'attendance' | 'history';
