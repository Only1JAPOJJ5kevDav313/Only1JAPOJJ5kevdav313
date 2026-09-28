import type { Generated } from 'kysely';

export interface SurveysTable {
  id: string;
  title: string;
  description: string;
  questions: unknown;
  active: Generated<boolean>;
  created_by: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}
