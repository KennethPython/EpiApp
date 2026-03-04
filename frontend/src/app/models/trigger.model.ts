export type TriggerType = 'CAFFEINE' | 'SLEEP' | 'MEDICATION';

export interface Trigger {
  id?: number;
  date: string; // ISO date: "2024-01-15"
  type: TriggerType;
  userId?: string;
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  CAFFEINE: 'Too much caffeine',
  SLEEP: 'Too little sleep',
  MEDICATION: 'Missed medication'
};
