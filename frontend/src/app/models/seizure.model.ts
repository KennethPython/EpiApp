export type SeizureType = 'TONIC_CLONIC' | 'ABSENCE' | 'FOCAL' | 'MYOCLONIC' | 'ATONIC' | 'OTHER';

export interface Seizure {
  id?: number;
  dateTime: string; // ISO local datetime: "2024-01-15T22:30:00"
  durationMinutes?: number;
  type?: SeizureType;
  notes?: string;
  userId?: string;
}

export const SEIZURE_TYPE_LABELS: Record<SeizureType, string> = {
  TONIC_CLONIC: 'Tonic-Clonic',
  ABSENCE: 'Absence',
  FOCAL: 'Focal',
  MYOCLONIC: 'Myoclonic',
  ATONIC: 'Atonic',
  OTHER: 'Other'
};
