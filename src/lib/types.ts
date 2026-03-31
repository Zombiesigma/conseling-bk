
export type Student = {
  id: string;
  name: string;
  class: string;
  studentIdNumber: string; // NISN
  gender: 'Laki-laki' | 'Perempuan';
};

export type Teacher = {
  id: string;
  name: string;
  employeeId: string; // NIP
  subject: string;
  phone: string;
  isCounselor?: boolean;
};

export type ClassRoom = {
  id: string;
  name: string;
  homeroomTeacherId: string;
  studentCount: number;
};

export type Violation = {
  id: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  type: string;
  date: string;
  description: string;
  counselorNotes: string;
  categories: string[];
  actionTaken?: string;
  points: number;
};

export type ViolationWithStudent = Violation & {
  student: Student;
};
