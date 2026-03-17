export interface Medication {
  id?: number;
  name: string;
  dosage: string;
  times: string[]; // ["09:00", "21:00"]
  userId?: string;
}

export interface MedicationLog {
  id?: number;
  medicationId: number;
  scheduledTime: string; // "09:00"
  date: string;          // "2024-01-15"
  takenAt?: string;      // ISO local datetime, set by backend
  userId?: string;
}
