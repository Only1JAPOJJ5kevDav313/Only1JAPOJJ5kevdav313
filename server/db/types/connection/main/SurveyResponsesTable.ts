import type { Generated } from 'kysely';

export interface SurveyResponsesTable {
  id: Generated<number>;
  survey_id: string;
  user_id: string;
  answers: unknown;
  created_at: Generated<Date>;
}
