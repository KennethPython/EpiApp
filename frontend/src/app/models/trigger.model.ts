export type TriggerType = 'CAFFEINE' | 'SLEEP' | 'MEDICATION' | 'OTHER';

export interface Trigger {
  id?: number;
  date: string; // ISO date: "2024-01-15"
  type: TriggerType;
  label?: string; // custom label when type is OTHER
  userId?: string;
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  CAFFEINE: 'Too much caffeine',
  SLEEP: 'Too little sleep',
  MEDICATION: 'Missed medication',
  OTHER: 'Other'
};
