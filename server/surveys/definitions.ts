export interface SurveyQuestion {
  id: string;
  text: string;
}

export interface SurveyDefinition {
  id: string;
  title: string;
  description: string;
  active: boolean;
  questions: SurveyQuestion[];
}

export const SURVEYS: SurveyDefinition[] = [
  {
    id: 'scope-usage-2026-09',
    title: 'Help us shape PFControl',
    description:
      "We're working out how PFControl should fit alongside other controlling tools, and we'd like your input.",
    active: true,
    questions: [
      {
        id: 'heard_of_veyra',
        text: 'Have you heard of a scope called "Veyra"?',
      },
      {
        id: 'controls_with_veyra',
        text: 'Are you using Veyra to control?',
      },
      {
        id: 'uses_pfcontrol_acars',
        text: "When you fly, do you use PFControl's ACARS / PDC?",
      },
    ],
  },
];

export function getSurvey(id: string): SurveyDefinition | undefined {
  return SURVEYS.find((s) => s.id === id);
}

export function getActiveSurvey(): SurveyDefinition | undefined {
  return SURVEYS.find((s) => s.active);
}

export function validateSurveyAnswers(
  survey: SurveyDefinition,
  raw: unknown
): Record<string, boolean> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  const answers: Record<string, boolean> = {};
  for (const q of survey.questions) {
    if (typeof input[q.id] !== 'boolean') return null;
    answers[q.id] = input[q.id] as boolean;
  }
  return answers;
}

export function publicSurvey(survey: SurveyDefinition) {
  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    questions: survey.questions,
  };
}
